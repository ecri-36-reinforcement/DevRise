const bcrypt = require('bcrypt');
import { quilDbConnection } from '../db/quilDBConnection';

import * as dotenv from 'dotenv';

export const userController = {
  createAccount: async (newUserObject) => {
    try {
      let values = [];
      if (newUserObject.oauthUser) {
        const { name, username, avatarUrl } = newUserObject;
        values = [username, name, avatarUrl, null];
      } else {
        const { username, password } = newUserObject;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        values = [username, null, null, hashedPassword];
      }

      const query = `INSERT INTO users (name, password, email, daily_job_count)\
      VALUES ($1, $2, $3, $4) RETURNING *;`;

      const { rows } = await quilDbConnection.query(query, values);

      return {
        success: true,
        userId: rows[0]._id,
        username: rows[0].username,
        name: rows[0].name,
        avatarUrl: rows[0].avatar_url,
      };
    } catch (err) {
      console.log(err.message);

      return { success: false, username: null, userId: null };
    }
  },
  saveProject: async (obj) => {
    try {
      const { projectName, projectData, userId } = obj;
      // const salt = await bcrypt.genSalt(10);
      // const hashedProjectData = await bcrypt.hash(projectData, salt);
      const query = `INSERT INTO projects (name, saved_db, owner_id)\
      VALUES ( $1, $2, (SELECT _id FROM users WHERE _id = $3)) RETURNING *;`;
      const values = [projectName, projectData, userId];
      const { rows } = await quilDbConnection.query(query, values);
      return { projectName: projectName, success: true };
    } catch (err) {
      return { success: false };
    }
  },
  getUserProject: async (userId) => {
    try {
      const query = `SELECT * FROM projects WHERE owner_id = $1;`;
      const values = [userId];
      const { rows } = await quilDbConnection.query(query, values);
      const resObj = {
        db: [],
        success: true,
      };
      rows.forEach((el) => {
        resObj.db.push(el);
      });
      return resObj;
    } catch (err) {
      return { success: false };
    }
  },
  validateUser: async (isUser) => {
    try {
      const { username, password } = isUser;
      const query = `SELECT * FROM users WHERE username = $1;`;
      const values = [username];
      const { rows } = await quilDbConnection.query(query, values);
      if (rows.length === 0)
        return { success: false, username: null, userId: null };
      else {
        const hashPass = rows[0].password;
        const result = await bcrypt.compare(password, hashPass);
        if (!result) return { success: false, username: null, userId: null };
        return {
          success: true,
          userId: rows[0]._id,
          username: rows[0].username,
          name: rows[0].name,
          avatarUrl: rows[0].avatar_url,
        };
      }
    } catch (err) {
      console.log(err, ' inside validate catch block');
    }
  },
  getQuilUser: async (username) => {
    try {
      const queryString = 'SELECT * FROM users WHERE username = $1';
      const values = [username];
      const { rows } = await quilDbConnection.query(queryString, values);
      return {
        success: true,
        username: rows[0].username,
        userId: rows[0]._id,
        name: rows[0].name,
        avatarUrl: rows[0].avatar_url,
      };
    } catch (error) {
      console.log(error.message);

      return { success: false, username: null, userId: null };
    }
  },

};