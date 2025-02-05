import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { streamText } from 'hono/streaming';

const app = new Hono();

interface Video {
  id: string;
  videoName: string;
  channelName: string;
  duration: string;
}

let videos: Video[] = [];

// Create a video
app.post('/video', async (c) => {
  try {
    const { videoName, channelName, duration } = await c.req.json();
    if (!videoName || !channelName || !duration) {
      return c.json({ message: "Missing required fields" }, 400);
    }
    const newVideo: Video = { id: uuidv4(), videoName, channelName, duration };
    videos.push(newVideo);
    return c.json(newVideo, 201);
  } catch (error) {
    return c.json({ message: "Invalid request format" }, 400);
  }
});

// Get all videos
app.get('/videos', (c) => {
  if (videos.length === 0) {
    return c.json({ message: "No videos available" }, 404);
  }
  return streamText(c, async (stream) => {
    for (const video of videos) {
      await stream.writeln(JSON.stringify(video));
      await stream.sleep(1000);
    }
  });
});

// Get video by ID
app.get('/video/:id', (c) => {
  const id = c.req.param("id");
  const video = videos.find((v) => v.id === id);
  if (!video) {
    return c.json({ message: "Video not found" }, 404);
  }
  return c.json(video);
});

// Update video by ID
app.put('/video/:id', async (c) => {
  try {
    const id = c.req.param("id");
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) {
      return c.json({ message: "Video not found" }, 404);
    }
    const { videoName, channelName, duration } = await c.req.json();
    videos[index] = { ...videos[index], videoName, channelName, duration };
    return c.json({ message: "Video updated", video: videos[index] });
  } catch (error) {
    return c.json({ message: "Invalid request format" }, 400);
  }
});

// Delete video by ID
app.delete('/video/:id', (c) => {
  const id = c.req.param("id");
  const initialLength = videos.length;
  videos = videos.filter((v) => v.id !== id);
  if (videos.length === initialLength) {
    return c.json({ message: "Video not found" }, 404);
  }
  return c.json({ message: "Video deleted" });
});

// Delete all videos
app.delete('/videos', (c) => {
  if (videos.length === 0) {
    return c.json({ message: "No videos to delete" }, 404);
  }
  videos = [];
  return c.json({ message: "All videos deleted" });
});

export default app;