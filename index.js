//Import Dependencies
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Replicate = require("replicate");
const cors = require("cors");
const path = require('path');
const sharp = require("sharp");


//Confiure env 
dotenv.config();


//Express Initialzation
const app = express();
const port = process.env.PORT || 3001;



// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI);

// Define a mongoose model for images
const Image = mongoose.model('ImageDb', {
  filename: String,
  data: Buffer,
  contentType: String,
  url: String,
  alt: String
});

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure Replicate API for Salesforce's Blip Model
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });


  
// Middleware to parse JSON in the request body

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/dist')));






// Middleware to process images using Sharp
const processImage = async (req, res, next) => {
  try {
    console.log(req.body.ur);
    const { originalname, buffer, mimetype } = req.file;
      // Resize image using sharp
      const processedImageBuffer = await sharp(buffer)
      .resize({ width: 300, height: 300 })
      .toBuffer();

    await replicate.run(
        "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
        {
          input: {
            image: req.body.ur.toString()
          }
        }
      ).then((output)=> {
        //Store in MongoDB
              const processedImage = new Image({
                filename: originalname,
                data: processedImageBuffer,
                contentType: mimetype,
                url: req.body.ur,
                alt: output.toString().substring(8)
              });
            
               processedImage.save().then(()=>{
                req.processedImageId = processedImage._id;
                     next();
               })
      })    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};




// Route to upload and process images
app.post('/upload', upload.single('image'), processImage, (req, res) => {
  try {
    const processedImageId = req.processedImageId;
    res.status(201).send(`Processed image uploaded successfully with ID: ${processedImageId}`);
  } catch (error) { 
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to handle alt requests
app.post('/alt', async (req, res) => {

    const ur = req.body.ur;
    if(ur == null){
        res.status(500).send('Invalid Url');
    }
    try {
        await replicate.run(
            "salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
            {
              input: {
                image: ur
              }
            }
          ).then((output)=> {
            res.status(201).send(output.substring(8));
          })
     
    } catch (error) {
    //  console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


// Route to Fetch Image Data from MongoDB
  app.get('/images',async (req, res )  => {
    try {
        const Image = mongoose.model('ImageDb');

        // Find all documents and retrieve
        const images = await Image.find({}, '_id filename url alt');
        res.status(200).send(images);
     
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });




// Start the express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


