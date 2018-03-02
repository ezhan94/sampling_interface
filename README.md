# sampling_interface
frontend interface for trajectory and macro sampling

### 1. Setup

##### 1.1 Install flask
pip install flask

##### 1.2 Deploy server.py

1.2.1 Single-Thread Depolyment<br>
      <br>Run server.py on command line or any IDE.

1.2.2 Multi-Thread Depolyment<br>
    <br>Install Gunicorn (pip install gunicorn)<br>
    <br>Run gunicorn -w \[number of workers\] -b \[port\] wsgi:app<br>
    <br>Example: gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app <br>
    <br>Multi-thread deoplyment has conflict with matplotlib library, make sure matplotlib is not imported in the code.

##### 1.3 Use browser to visit the web interface,
The interface adress is: 0.0.0.0:5000 if it is visited from the local host.
Otherwise, replace 0.0.0.0 with the IP address of your server. Chrome is recommended.

### 2. Instruction

##### 2.1 Simulation with Pre-set Initialization
2.1.1 Use the dropdown list on the right side to select one initialization.
All 10 initializations are 10-frame plays captured from NBA games.

2.2.5 Click Simulate button to visualize the sampling trajectories in
the following 40 frames. Trajectories are animated at 7fps.

2.2.3 Macro Goals toggle button is used to turn on or turn off the visualization of macro goals.

2.2.4 Replay button is used to replay the last sampling since Simulate button
can generate different output every time.


##### 2.2 Free-Form Simulation

2.2.1 On the free-form interface, blue buttons are used for input and green buttons are used for visualization

2.2.2 Use Start Locations button (blue) to input the start locations for 5 players.
Simply click the button and then, click 5 locations on the court to finalize the input.

2.2.3 Use Macro Goals button (blue) to set the macro goals (optional). After clicking the button,
click 5 locations on the left side of the court to finialize the input.
The button will switch between Macro Goals and Remove Macros, click Remove Macros to
 remove the existing macro goals that you have input.

2.2.4 Click Simulate button (green) to visualize the sampling trajectories. If no macro goals
are provided, it will use the default value. Trajectories are animated at 7fps.

2.2.5 Macro Goals toggle button is used to turn on or turn off the visualization of macro goals.

2.2.6 Replay button is used to replay the last sampling since Simulate button
can generate different output every time.







