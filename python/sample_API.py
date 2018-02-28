import numpy as np
import pickle
import python.bball_data.cfg as cfg


from python.model import *
from python.bball_data.utils import normalize, unnormalize, plot_animation, plot_macrogoals


# calculating the angle anchor-centroic-point with cosine law
def _calc_angle(centroid, anchor, point):
	a = np.linalg.norm(point-anchor)
	b = np.linalg.norm(anchor-centroid)
	c = np.linalg.norm(point-centroid)

	val = (b**2+c**2-a**2) / (2*b*c)

	if val > 1:
		val = 1
	elif val < -1:
		val = -1

	return math.acos(val)


# orders the players
# player 5 is closest to the centroid
# players 1-4 are ordered in a clockwise fashion wrt centroid
def _order_players(players, macros):
	players = np.reshape(players, (5,2))

	centroid = np.mean(players, axis=0)
	dist_to_centroid = np.linalg.norm(players-centroid, axis=1)
	p5 = np.argmin(dist_to_centroid)

	anchor = np.array([50, centroid[1]])

	angles = np.array([_calc_angle(centroid, anchor, players[k])*np.sign(centroid[1]-players[k][1]) for k in range(len(players))])
	angles[p5] = 4 # ensures p5 is ordered last

	order = np.argsort(angles)
	final_order = np.array([players[k] for k in order])

	final_macros = np.zeros(macros.shape)
	for i in range(5):
		final_macros[:,:,i] = macros[:,:,order[i]]

	return np.reshape(final_order, 10), final_macros


def _load_model(trial):
	load_path = './python/saved/%03d/' % trial
	params = pickle.load(open(load_path+'params.p', 'rb'))

	# loading the model onto CPU
	state_dict = torch.load(load_path+'model/'+params['model']+'_state_dict_best.pth', map_location=lambda storage, loc: storage)
	model = eval(params['model'])(params)
	model.load_state_dict(state_dict)

	return model


def sample_from_model(starting_positions, macro_goals, scalenshift=True):
	model = _load_model(131)

	if scalenshift:
		starting_positions = normalize(np.array(starting_positions)/cfg.SCALE)
	starting_positions, macro_goals = _order_players(starting_positions, macro_goals)

	# putting starting_positions into correct input for model method
	y = np.zeros((len(macro_goals), len(macro_goals[0]), 10))
	y[0,:,:] = starting_positions

	# sampling from model
	samples, macro_samples = model.sample_single(y, macro_goals)

	samples = samples.data.cpu().numpy()
	samples = np.swapaxes(samples, 0, 1)
	samples = unnormalize(samples)

	macro_samples = macro_samples.data.cpu().numpy()
	macro_samples = np.swapaxes(macro_samples, 0, 1)

	return samples[0], macro_samples[0]


def sample_preset(idx, seq_len=50, burn_in=10):
	model = _load_model(131)

	preset_path = './python/saved/preset/'
	sequences = pickle.load(open(preset_path+'sequences.p', 'rb'))
	macro_goals = pickle.load(open(preset_path+'macro_goals.p', 'rb'))
	macro_goals = macro_goals.astype(float) # temporary solution

	# sampling from model
	samples, macro_samples = model.sample_single(sequences[:,idx,:][:,None,:], macro_goals[:,idx,:][:,None,:], burn_in=burn_in)

	samples = samples.data.cpu().numpy()
	samples = np.swapaxes(samples, 0, 1)
	samples = unnormalize(samples)

	macro_samples = macro_samples.data.cpu().numpy()
	macro_samples = np.swapaxes(macro_samples, 0, 1)

	return samples[0], macro_samples[0]


######################################################################
############################### MAIN #################################
######################################################################

#
# # default values, should not be changed
# colormap = cfg.CMAP_OFFENSE # ['b', 'r', 'g', 'm', 'y']
# seq_len = 50
# n_samples = 1
# macro_goals = -np.ones((seq_len, n_samples, 5))
#
# # 3) ex: setting macro-goals
# macro_end = np.array([0, 2, 4, 6, 8])
# for i in range(50):
# 	macro_goals[-i,0] = macro_end
#
# # starting positions, can also be numpy array
# # ex:	[x1   y1  x2   y2   x3   y3   x4   y4   x5   y5]
# start = [400, 50, 400, 150, 390, 250, 400, 350, 400, 450]
#
# # sample from model
# sample, macro_sample = sample_from_model(start, macro_goals)
#
# print sample
#
# # 1) animating just the trajectory
# plot_animation([sample], colormap=colormap, show=True)


# # 2) animating trajectory with macro-goals
# plot_macrogoals([sample], macro_goals=macro_sample, colormap=colormap, show=True)