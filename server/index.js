/**
 * Tube Flow DJ - Audio Proxy Server
 * 
 * To run this:
 * 1. npm install express cors @distube/ytdl-core
 * 2. node index.js
 */

const express = require('express');
const cors = require('cors');
// using @distube/ytdl-core as the original ytdl-core is deprecated/unreliable
const ytdl = require('@distube/ytdl-core'); 
const app = express();

// Google Cloud Run automatically sets the PORT environment variable.
// We fallback to 8080, which is the default for Cloud Run containers.
const PORT = parseInt(process.env.PORT) || 8080;

app.use(cors());

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).send('Tube Flow DJ Proxy Server is healthy and running.');
});

app.get('/stream', async (req, res) => {
  const { url } = req.query;
  console.log(`[Request] Incoming stream request for URL: ${url}`);

  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL is required');
  }

  try {
    if (!ytdl.validateURL(url)) {
      console.log(`[Error] Invalid URL: ${url}`);
      return res.status(400).send('Invalid YouTube URL');
    }

    // Get Info
    console.log(`[Info] Fetching metadata...`);
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    });

    if (!format) {
       console.log(`[Error] No format found`);
       return res.status(404).send('No suitable audio format found');
    }

    console.log(`[Stream] Starting stream: ${info.videoDetails.title}`);
    
    // Set headers
    res.header('Content-Disposition', `attachment; filename="${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_')}.mp3"`);
    res.header('Content-Type', 'audio/mpeg');
    
    // Attempt to download with a larger buffer to prevent stalling
    const stream = ytdl(url, { 
        format: format,
        highWaterMark: 1 << 25, // 32MB buffer
    });
    
    stream.on('error', (err) => {
      console.error('[Stream Error]', err.message);
      if (!res.headersSent) {
        res.status(500).send('Audio Processing Error: ' + err.message);
      } else {
        res.end();
      }
    });

    stream.pipe(res);

  } catch (error) {
    console.error('[General Error]', error.message);
    if (!res.headersSent) {
      res.status(500).send('Error streaming audio: ' + error.message);
    }
  }
});

// Bind to 0.0.0.0 to ensure the server is accessible from outside the container
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tube Flow Proxy running on port ${PORT}`);
});