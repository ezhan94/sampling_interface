import torch
from torch.autograd import Variable


def one_hot_encode(inds, N):
	# inds should be a torch.Tensor, not a Variable
	dims = [inds.size(i) for i in range(len(inds.size()))]
	inds = inds.unsqueeze(-1).cpu().long()
	dims.append(N)
	ret = torch.zeros(dims)
	ret.scatter_(-1, inds, 1)
	return ret


def sample_gauss(mean, std):
	eps = torch.FloatTensor(std.size()).normal_()
	eps = Variable(eps)
	if mean.is_cuda:
		eps = eps.cuda()
	return eps.mul(std).add_(mean)


def sample_multinomial(probs):
	inds = torch.multinomial(probs, 1).data.cpu().long().squeeze()
	ret = one_hot_encode(inds, probs.size(-1))
	if probs.is_cuda:
		ret = ret.cuda()
	return ret