import time
from flask import Flask, request, g, render_template, jsonify, url_for, Response, url_for, flash, session, redirect
from python.sample_API import sample_from_model, sample_preset
import numpy as np
import json
from python.bball_data.cfg import SCALE
from sklearn.metrics.pairwise import pairwise_distances
from scipy.optimize import linear_sum_assignment

app = Flask(__name__)



#create entry for this user
@app.route('/authorize/')
def authorize():
    global userData
    userName = request.args.get("userName")
    userData={'name':userName,'time':int(time.time())}
    auth = {'status': 1}
    return jsonify(auth)


#index page
@app.route('/')
def index():
    return render_template('index.html')

#index page
@app.route('/sample/')
def sample():
    #load and scale the input
    startLoc = np.asarray(json.loads(request.args.get("startLoc")),dtype=float)*SCALE
    macroGoal = json.loads(request.args.get("macroGoal"))

    seq_len = 30 # no more than 50

    input_macro = np.ones((seq_len,1,5))*-1
    if len(macroGoal) == 5:
        for i in range(seq_len):
            input_macro[-i,0] = macroGoal
    sample, macro_sample = sample_from_model(startLoc, input_macro)

    #sample, macro_sample = sample_preset(idx=1)

    #associate output and start point
    loc1 = startLoc.reshape(-1,2)
    loc2 = sample[0].reshape(-1,2)
    dist = pairwise_distances(loc1, loc2, 'sqeuclidean')
    assignment = np.asarray(linear_sum_assignment(dist))
    sample[:,::2] = sample[:,::2][:,assignment[1]].copy()
    sample[:,1::2] = sample[:,1::2][:,assignment[1]].copy()
    macro_sample = macro_sample[:,assignment[1]].copy()
    #the trajectory can be interpolated for smooth animation
    sample_data={'traj':sample.tolist(),'macro':macro_sample.tolist()}
    return jsonify(sample_data)

if __name__ == "__main__":
    app.run(host = '0.0.0.0')