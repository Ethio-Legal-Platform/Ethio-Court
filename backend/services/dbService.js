'use strict';
const fs = require('fs');
const path = require('path');
const { getIsConnected } = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');

function getFilePath(collectionName) {
  return path.join(DATA_DIR, collectionName + '.json');
}

function readJSON(collectionName) {
  const p = getFilePath(collectionName);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading JSON collection ' + collectionName + ':', err.message);
    return [];
  }
}

function writeJSON(collectionName, data) {
  const p = getFilePath(collectionName);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

async function find(collectionName, query = {}) {
  const items = readJSON(collectionName);
  return items.filter(item => {
    return Object.keys(query).every(key => item[key] === query[key]);
  });
}

async function findOne(collectionName, query = {}) {
  const items = readJSON(collectionName);
  return items.find(item => {
    return Object.keys(query).every(key => item[key] === query[key]);
  }) || null;
}

async function insert(collectionName, record) {
  const items = readJSON(collectionName);
  items.unshift(record);
  writeJSON(collectionName, items);
  return record;
}

async function updateOne(collectionName, query, updateFields) {
  const items = readJSON(collectionName);
  const idx = items.findIndex(item => {
    return Object.keys(query).every(key => item[key] === query[key]);
  });
  if (idx !== -1) {
    items[idx] = Object.assign({}, items[idx], updateFields);
    writeJSON(collectionName, items);
    return items[idx];
  }
  return null;
}

async function deleteOne(collectionName, query) {
  const items = readJSON(collectionName);
  const filtered = items.filter(item => {
    return !Object.keys(query).every(key => item[key] === query[key]);
  });
  writeJSON(collectionName, filtered);
  return true;
}

module.exports = {
  readJSON,
  writeJSON,
  find,
  findOne,
  insert,
  updateOne,
  deleteOne
};
