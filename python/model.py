import math
import torch
import torch.nn as nn
from torch.autograd import Variable
from python.model_utils import *


def cudafy_list(states):
	for i in range(len(states)):
		states[i] = states[i].cuda()
	return states


class MACRO_VRNN(nn.Module):

	def __init__(self, params):
		super(MACRO_VRNN, self).__init__()

		self.input_type = 'xym'
		self.params = params
		x_dim = params['x_dim']
		y_dim = params['y_dim']
		z_dim = params['z_dim']
		h_dim = params['h_dim']
		m_dim = params['m_dim']
		rnn_micro_dim = params['rnn_micro_dim']
		rnn_macro_dim = params['rnn_macro_dim']
		n_layers = params['n_layers']
		n_agents = params['n_agents']

		self.dec_macro = nn.ModuleList([nn.Sequential(
			nn.Linear(y_dim+rnn_macro_dim, h_dim),
			nn.ReLU(),
			nn.Linear(h_dim, m_dim),
			nn.LogSoftmax()) for i in range(n_agents)])

		self.enc = nn.ModuleList([nn.Sequential(
			nn.Linear(x_dim+m_dim+rnn_micro_dim, h_dim),
			nn.ReLU(),
			nn.Linear(h_dim, h_dim),
			nn.ReLU()) for i in range(n_agents)])
		self.enc_mean = nn.ModuleList([nn.Linear(h_dim, z_dim) for i in range(n_agents)])
		self.enc_std = nn.ModuleList([nn.Sequential(
			nn.Linear(h_dim, z_dim),
			nn.Softplus()) for i in range(n_agents)])

		self.prior = nn.ModuleList([nn.Sequential(
			nn.Linear(m_dim+rnn_micro_dim, h_dim),
			nn.ReLU(),
			nn.Linear(h_dim, h_dim),
			nn.ReLU()) for i in range(n_agents)])
		self.prior_mean = nn.ModuleList([nn.Linear(h_dim, z_dim) for i in range(n_agents)])
		self.prior_std = nn.ModuleList([nn.Sequential(
			nn.Linear(h_dim, z_dim),
			nn.Softplus()) for i in range(n_agents)])

		self.dec = nn.ModuleList([nn.Sequential(
			nn.Linear(y_dim+m_dim+z_dim+rnn_micro_dim, h_dim),
			nn.ReLU(),
			nn.Linear(h_dim, h_dim),
			nn.ReLU()) for i in range(n_agents)])
		self.dec_mean = nn.ModuleList([nn.Linear(h_dim, x_dim) for i in range(n_agents)])
		self.dec_std = nn.ModuleList([nn.Sequential(
			nn.Linear(h_dim, x_dim),
			nn.Softplus()) for i in range(n_agents)])

		self.gru_micro = nn.ModuleList([nn.GRU(x_dim+z_dim, rnn_micro_dim, n_layers) for i in range(n_agents)])
		self.gru_macro = nn.GRU(m_dim*n_agents, rnn_macro_dim, n_layers)


	def sample_single(self, y, macro_goals, burn_in=0):
		n_agents = self.params['n_agents']

		# converting numpy arrays to Variables
		y = Variable(torch.Tensor(y))
		macro_goals = Variable(torch.Tensor(macro_goals))
		m = Variable(torch.zeros(y.size(0), n_agents, y.size(1), self.params['m_dim']))

		# initial hidden states
		h_micro = [Variable(torch.zeros(self.params['n_layers'], y.size(1), self.params['rnn_micro_dim'])) for i in range(n_agents)]
		h_macro = Variable(torch.zeros(self.params['n_layers'], y.size(1), self.params['rnn_macro_dim']))

		ret = y.clone()

		for t in range(y.size(0)-1):
			y_t = ret[t].clone()
			m_t = m[t].clone()

			# sampling the macro-goals
			for i in range(n_agents):
				dec_macro_t = self.dec_macro[i](torch.cat([y_t, h_macro[-1]], 1))

				curr_goal = int(macro_goals[t,0,i].data[0])

				if curr_goal == -1:
					m_t[i] = sample_multinomial(torch.exp(dec_macro_t))
				else:
					if burn_in > 0 and t >= burn_in:
						m_t[i] = sample_multinomial(torch.exp(dec_macro_t))
					else:
						m_t[i,0,curr_goal] = 1
				
			macro_goals[t] = torch.max(m_t, 2)[1].transpose(0,1)
			m_t_concat = m_t.transpose(0,1).contiguous().view(y.size(1), -1)
			_, h_macro = self.gru_macro(torch.cat([m_t_concat], 1).unsqueeze(0), h_macro)

			# sampling next postiion
			for i in range(n_agents):
				prior_t = self.prior[i](torch.cat([m_t[i], h_micro[i][-1]], 1))
				prior_mean_t = self.prior_mean[i](prior_t)
				prior_std_t = self.prior_std[i](prior_t)

				z_t = sample_gauss(prior_mean_t, prior_std_t)

				dec_t = self.dec[i](torch.cat([y_t, m_t[i], z_t, h_micro[i][-1]], 1))
				dec_mean_t = self.dec_mean[i](dec_t)
				dec_std_t = self.dec_std[i](dec_t)

				ret[t+1,:,2*i:2*i+2] = y[t+1,:,2*i:2*i+2] if t < burn_in else sample_gauss(dec_mean_t, dec_std_t)
				#ret[t+1,:,2*i:2*i+2] = sample_gauss(dec_mean_t, dec_std_t)
				_, h_micro[i] = self.gru_micro[i](torch.cat([ret[t+1,:,2*i:2*i+2], z_t], 1).unsqueeze(0), h_micro[i])

		macro_goals.data[-1] = macro_goals.data[-2] # a bit hack-y for last macro-goal

		return ret, macro_goals