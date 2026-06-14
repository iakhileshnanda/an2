const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const url = process.env.RESUME_URL;

  if (!url || url === 'your_resume_pdf_url_here') {
    return res.status(404).json({
      error: 'Resume not available yet'
    });
  }

  res.json({
    url,
    message: "Opening Akhilesh's resume — one moment."
  });
});

module.exports = router;
