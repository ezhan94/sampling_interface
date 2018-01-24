import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib import animation
from skimage.transform import resize
import python.bball_data.cfg as cfg


DATAPATH = cfg.DATAPATH
N_TRAIN = cfg.N_TRAIN
N_TEST = cfg.N_TEST
SCALE = cfg.SCALE
SEQ_LENGTH = cfg.SEQUENCE_LENGTH
X_DIM = cfg.SEQUENCE_DIMENSION
MACRO_SIZE = cfg.MACRO_SIZE*SCALE


def normalize(x):
    dim = x.shape[-1]
    return np.divide(x-cfg.SHIFT[:dim], cfg.NORMALIZE[:dim])


def unnormalize(x):
    dim = x.shape[-1]
    return np.multiply(x, cfg.NORMALIZE[:dim]) + cfg.SHIFT[:dim]


def plot_animation(sequences=[], colormap=[], default_color='b', save_path='', save_name='', show=False, burn_in=0):
    n_seq = len(sequences)

    if n_seq == 0:
        return

    n_steps = len(sequences[0])
    n_players = int(len(sequences[0][0])/2)

    while len(colormap) < n_players:
        colormap += default_color

    fig = plt.figure(figsize=(5*n_seq,5))
    img = plt.imread(DATAPATH+'court.png')
    img = resize(img,(SCALE*cfg.WIDTH,SCALE*cfg.LENGTH,3))

    trajectories = []
    locations = []
    burn_ins = []
    ax_list = [fig.add_subplot(101+10*n_seq+i) for i in range(n_seq)]

    for ax in ax_list:
        ax.imshow(img)

        ax.set_xlim([-50,550])
        ax.set_ylim([-50,550])
        ax.get_xaxis().set_visible(False)
        ax.get_yaxis().set_visible(False)

        trajectories += [ax.plot([],[])[0] for _ in range(n_players)]
        locations += [ax.plot([],[])[0] for _ in range(n_players)]
        burn_ins += [ax.plot([],[])[0] for _ in range(n_players)]

    def init():
        for k in range(n_seq*n_players):
            traj = trajectories[k]
            loc = locations[k]
            burn = burn_ins[k]
            color = colormap[k % n_players]

            traj.set_data([],[])
            traj.set_color(color)
            traj.set_linewidth(3)
            traj.set_alpha(0.7)

            loc.set_data([],[])
            loc.set_color(color)
            loc.set_marker('o')
            loc.set_markersize(12)

            burn.set_data([],[])
            burn.set_color('0.01')
            burn.set_linewidth(6)
            burn.set_alpha(0.5)
        return trajectories+locations+burn_ins

    def animate(t):
        if t >= n_steps:
            t = n_steps-1
        for k in range(n_seq*n_players):
            p = k % n_players
            seq = sequences[int(k/n_players)]
            trajectories[k].set_data(SCALE*seq[:t+1,2*p], SCALE*seq[:t+1,2*p+1])
            locations[k].set_data(SCALE*seq[t,2*p], SCALE*seq[t,2*p+1])
            burn_ins[k].set_data(SCALE*seq[:min(t, burn_in),2*p], SCALE*seq[:min(t, burn_in),2*p+1])
        return trajectories+locations+burn_ins

    plt.tight_layout(pad=0)

    anim = animation.FuncAnimation(fig, animate, init_func=init, frames=72, interval=200, blit=True)

    if len(save_name) > 0:
        anim.save(save_path+save_name+'.mp4', fps=7, extra_args=['-vcodec', 'libx264'])

    if show:
        plt.show()


def plot_macrogoals(sequence, macro_goals, colormap=[], burn_in=0, save_path='', show=False, save_name=''):
    n_players = 5

    seq = sequence[0]
    n_steps = len(seq)

    if len(macro_goals.shape) == 1:
        macro_goals = np.expand_dims(macro_goals, axis=1)

    fig = plt.figure(figsize=(5,5))
    img = plt.imread(DATAPATH+'court.png')
    img = resize(img,(SCALE*cfg.WIDTH,SCALE*cfg.LENGTH,3))

    trajectories = []
    locations = []
    ax = fig.add_subplot(111)
    ax.imshow(img)
    ax.set_xlim([-50,550])
    ax.set_ylim([-50,550])
    ax.get_xaxis().set_visible(False)
    ax.get_yaxis().set_visible(False)
    trajectories += [ax.plot([],[])[0] for _ in range(n_players)]
    locations += [ax.plot([],[])[0] for _ in range(n_players)]

    from matplotlib.patches import Rectangle
    macros = [Rectangle(xy=(0, 0), width=MACRO_SIZE, height=MACRO_SIZE, alpha=0) for k in range(macro_goals.shape[1])]

    def init():
        for k in range(n_players):
            traj = trajectories[k]
            loc = locations[k]
            color = colormap[k % n_players]

            traj.set_data([],[])
            traj.set_color(color)
            traj.set_linewidth(3)
            traj.set_alpha(1)

            loc.set_data([],[])
            loc.set_color(color)
            loc.set_marker('o')
            loc.set_markersize(10)

            if k < len(macros):
                m = macros[k]
                ax.add_patch(m)
                m.set_color(color)

        return trajectories+locations+macros

    def animate(t):
        for p in range(n_players):
            trajectories[p].set_data(SCALE*seq[:t+1,2*p], SCALE*seq[:t+1,2*p+1])
            locations[p].set_data(SCALE*seq[t,2*p], SCALE*seq[t,2*p+1])

        if t == burn_in:
            x = seq[:burn_in,::2]
            y = seq[:burn_in,1::2]
            ax.plot(SCALE*x, SCALE*y, color='0.01', linewidth=6, alpha=0.5) # lines

        if t >= burn_in:
            for j,m in enumerate(macros):
                m_x = int(macro_goals[t,j]/cfg.N_MACRO_Y)
                m_y = macro_goals[t,j] - cfg.N_MACRO_Y*m_x
                m.set_xy([m_x*MACRO_SIZE, m_y*MACRO_SIZE])
                m.set_alpha(0.5)

        return trajectories+locations+macros

    plt.tight_layout(pad=0)
    
    anim = animation.FuncAnimation(fig, animate, init_func=init, frames=n_steps, interval=200, blit=True)

    if len(save_name) > 0:
        anim.save(save_path+save_name+'.mp4', fps=7, extra_args=['-vcodec', 'libx264'])

    if show:
        plt.show()