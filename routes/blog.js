const express = require("express");
const Blog = require("../models/Blog");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .populate("author", "name username")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "name username"
    );
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog (protected)
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    const blog = new Blog({
      title,
      content,
      author: req.user.userId,
      tags: tags || [],
      category: category || "general",
    });

    await blog.save();
    await blog.populate("author", "name username");
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update blog (protected)
router.put("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("author", "name username");

    res.json(updatedBlog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete blog (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (blog.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's blogs (protected)
router.get("/user/my-blogs", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.userId })
      .populate("author", "name username")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
