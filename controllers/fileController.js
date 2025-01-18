const {
  createFile,
  getFileById,
  getlistFiles,
  deleteFileById,
  updateFileById
} = require('../models/fileModel');

const path = require('path');
const fs = require('fs');
// const { off } = require('process');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400)
        .json({ message: 'No file uploaded!' });
    }

    const { filename, mimetype, size } = req.file;        
    const userId = req.user.userId;
    const uploadDate = new Date();

    await createFile(
      filename,
      path.extname(filename),
      mimetype,
      size,
      uploadDate,
      userId
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
  const userId = req.user.userId;

  try {
    const files =
      await getlistFiles(userId, listSize, offset);
    console.log(files);
    res.json({ files: files });
  } catch (error) {
    console.error('Error listing files', error);
    res.status(500)
      .json({ message: 'Server Error!' });
  }
};

const getFileInfo = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const file = await getFileById(id, userId);
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
  const fileId = id.replaceAll(':', '');
  const userId = req.user.userId;

  try {    
    const file = await getFileById(fileId, userId);
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
  const userId = req.user.userId;

  try {
    const file = await getFileById(id, userId);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found!' });
    }

    const filePath = path
      .join(__dirname, '../uploads', file.name);
    fs.unlinkSync(filePath);

    await deleteFileById(id);
    res.json({ message: 'File deleted successfully!' });
  } catch (error) {
    console.error('Error delete file!', error);
    res.status(500).json({ message: 'Server Error!' });
  }
};

const updateFile = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const file = await getFileById(id, userId);
    if (!file) {
      return res.status(404)
        .json({ message: 'File not found! ' });
    }
    const previousFilePath = path.join(__dirname, '../uploads', file.name);
    fs.unlinkSync(previousFilePath);
    const { originalname, mimetype, size } = req.file;
    const uploadDate = new Date();

    await updateFileById(
      originalname,
      path.extname(originalname),
      mimetype,
      size,
      uploadDate,
      id
    );
    res.json({ message: 'File updated successfully! ' });
  } catch (error) {
    console.error('Error updating file! ', error);
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
