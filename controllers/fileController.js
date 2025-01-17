const {
  createFile,
  getFileById,
  getlistFiles,
  deleteFileById,
  updateFileById
} = require('../models/fileModel');

const path = require('path');
const fs = require('fs');
const { off } = require('process');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400)
        .json({ message: 'No file uploaded!' });
    }

    const { originalname, mimetype, size } = req.file;
    const uploadDate = new Date();

    await createFile(
      originalname,
      path.extname(originalname),
      mimetype,
      size,
      uploadDate,
      req.user.id
    );

    res.status(201)
      .json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file!', error);
    res.status(500)
      .json({ message: 'Internal Server Error!' });
  }
};



const listFiles = async (req, res) => {
  const listSize = parseInt(req.query.list_size) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * listSize;

  try {
    const files =
      await getlistFiles(req.user.id, resourceLimits, offset);
    req.json(files);
  } catch (error) {
    console.error('Error listing files', error);
    res.status(500)
      .json({ message: 'Server Error!' });
  }
};

const getFileInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await getFileById(id, req.user.id);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found!' });
    }

    res.json(file);
  } catch (error) {
    console.error('Error getting file!', error);
    res.status(500)
      .json({ message: 'Server Error!' });
  }
};

const downloadFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = getFileById(id, req.user.id);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found!' });
    }
    const filePath = path
      .join(__dirname, '../uploads', file.name);
    res.download(filePath, file.name);
  } catch (error) {
    console.error('File download error!', error);
    res.status(500)
      .json({ message: 'Server Error!' });
  }
};

const deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await getFileById(id, req.use.id);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found!' });
    }

    const filePath = path
      .join(__dirname, '../uploads', file.name);
    fs.unlinkSync(filePath);

    await deleteFile(id);
    res.json({ message: 'File deleted successfully!' });
  } catch (error) {
    console.log('Error delete file!', error);
    res.status(500).json({ message: 'Server Error!' });
  }
};

const updateFile = async (req, res) => {
  const { id } = req.params;

  try {
    const file = await getFileById(id, req.user.id);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found! ' });
    }

    const previousFilePath = path.join(__dirname, '../uploads', file.name);
    fs.unlinkSync(previousFilePath);

    const { originalname, mimetype, size } = req.file;
    const uploadDate = new Date();

    await updateFile(
      originalname,
      path.extname(originalname),
      mimetype,
      size,
      uploadDate,
      id
    );

    res.json({ message: 'File updated successfully! '});
  } catch (error) {
    console.log('Error updating file! ', error);
    res.status(500).json({ message: 'Server Error!' });
  }

};

module.exports = {
  uploadFile,
  listFiles,
  getFileInfo,
  downloadFile,
  deleteFile,
  updateFile
};
