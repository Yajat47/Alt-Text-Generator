Image Alt Text Generator Application



Running Instructions:
1. Clone the Repo   "git clone https://github.com/Yajat47/Alt-Text-Generator.git"
2. Change Directory  "cd Alt-Text-Generator"
3. Run : "npm install"
4. Create a ".env" file and fill the keys.
5. Run : "npm start" and go to "http://localhost:3001" on your browser.


About:

Tech Stack : MERN

Alt Text Generation:

Using Salesforce's Blip Model via Replicate's API

API Routes:

POST "/upload" : Exposes MongoDb Storage
POST "/alt" : API call to Replicate
GET "/images" : Fetch Uploaded Images from MongoDb
