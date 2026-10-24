// This component should run the python script in the game directory (sibling to y2k-os) and return the output to the frontend. The python script should be able to take in arguments from the frontend and return the output as a string. The frontend should be able to display the output in a terminal-like interface.
// The python script uses tkinter to display the ui for this financial terminal, this Tkinter needs to be converted to a react component
// [React Button Click] ──> Fetch HTTP POST (JSON) ──> [FastAPI Server] ──> Runs Python Logic ──> Returns JSON ──> React State Updates UI
