import time
from flask import Flask, request, g, render_template, jsonify, url_for, Response, url_for, flash, session, redirect
from python.sample_API import sample_from_model, sample_preset
import numpy as np
import json
from python.bball_data.cfg import  SCALE
from sklearn.metrics.pairwise import pairwise_distances
from scipy.optimize import linear_sum_assignment
import pickle
app = Flask(__name__)
# app.secret_key='\xaa&\xfb\xbaU\x89\xea\xd8*\xf9\x94\x00\xe7\xf6C\xea/`c\xb8\x97Y\xd4w'

#create entry for this user
@app.route('/authorize/')
def authorize():
    # global userData
    userName = request.args.get("userName")
    userData={'name':userName,'time':int(time.time())}
    auth = {'status': 1}
    return jsonify(auth)


#index page
@app.route('/')
def index():
    # global preset_sequence, preset_macro_goals
    preset_path = './python/saved/preset/'
    preset_sequence = pickle.load(open(preset_path + 'sequences.p', 'rb'))
    N_preset = preset_sequence.shape[1]
    return render_template('index.html', preset_n = N_preset)

#index page
@app.route('/sample/')
def sample():
    #load and scale the input
    startLoc = np.asarray(json.loads(request.args.get("startLoc")),dtype=float)*SCALE
    macroGoal = json.loads(request.args.get("macroGoal"))
    preset_idx = int(request.args.get("preset_ID"))
    if preset_idx != -1:
        sample, macro_sample = sample_preset(preset_idx)
    else:
        seq_len = 30
        input_macro = np.ones((seq_len,1,5))*-1
        if len(macroGoal) == 5:
            for i in range(seq_len):
                input_macro[-i,0] = macroGoal
        sample, macro_sample = sample_from_model(startLoc, input_macro)

        #associate output and start point
        loc1 = startLoc.reshape(-1,2)/SCALE
        loc2 = sample[0].reshape(-1,2)
        dist = pairwise_distances(loc1, loc2, 'sqeuclidean')
        assignment = np.asarray(linear_sum_assignment(dist))
        sample[:,::2] = sample[:,::2][:,assignment[1]].copy()
        sample[:,1::2] = sample[:,1::2][:,assignment[1]].copy()
        macro_sample = macro_sample[:,assignment[1]].copy()
        #the trajectory can be interpolated for smooth animation
    sample_data={'traj':sample.tolist(),'macro':macro_sample.tolist()}
    return jsonify(sample_data)

@app.route('/feed_preset/')
def feed_preset():
    # global preset_sequence
    preset_path = './python/saved/preset/'
    preset_sequence = pickle.load(open(preset_path + 'sequences.p', 'rb'))
    preset_idx = int(request.args.get("preset_ID"))
    target_seq = np.zeros((preset_sequence.shape[0],preset_sequence.shape[2]))
    seq_part = preset_sequence[:10,preset_idx,:].copy()
    target_seq[:10]=seq_part

    return jsonify({'preset':target_seq.tolist()})

if __name__ == "__main__":
    app.run(host = '0.0.0.0')