# Seek-a-clip
Here is the README content for Seek-a-clip with clear explanations and each command placed on its own separate line so beginners can easily read and follow it without getting confused:

Seek-a-clip

AI-powered video repurposing tool that turns long videos into viral short clips, with automatic highlight detection, captions, and vertical reformatting for TikTok, Reels, and Shorts.

Project Structure

studio: Video processing and clip generation scripts and workflows in Python.
web: Web interface, styling, brand assets, and frontend files in HTML, CSS, and JavaScript.

Run Locally

Step 1: Clone the repository to your computer.

git clone https://github.com/ItsMe-Akshit/Seek-a-clip.git

Step 2: Enter the project folder.

cd Seek-a-clip

Step 3: Create and activate a Python virtual environment.

python -m venv .venv
.venv\Scripts\activate

Step 4: Install the required Python packages.

pip install -r requirements.txt

(Note: If there is no requirements.txt in the main folder, check inside the studio folder and install from its requirements file or pyproject.toml.)

Step 5: Set up environment variables.
Create a .env file in the project folder and add any needed API keys or settings. Do not commit .env to Git.

Step 6: Run the studio scripts.

cd studio
python main.py

(Replace main.py with your main script name inside studio if it is named differently.)

Step 7: Run the web interface locally.

cd web
python -m http.server 8080

Then open this link in your browser:

http://localhost:8080

Features

Converts long-form videos into short vertical clips for TikTok, Reels, and Shorts.
Automatic highlight detection and captioning workflow.
Combines a web frontend with a dedicated studio workspace.

Author

Bandi Akshith (ItsMe-Akshit)
