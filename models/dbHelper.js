const pool = require('../models/db');

exports.getAll = (tableName, req, res) => {
  pool.connect((err, client, done) => {
    if (err) {
      console.log(err);
    }
    console.log('connected to db successfully');
    const query = `SELECT * FROM ${tableName}`;
    client.query(query, (error, result) => {
      done();
      if (err) {
        res.status(400).json({ error });
      }
      if (result < '1') {
        res.status(404).json({
          status: 'failed',
          message: 'Resource not found',
        });
      } else {
        res.status(200).json({
          status: 'success',
          message: 'Resources fetched successfully',
          data: result.rows,
        });
      }
    });
  });
  return tableName;
};

exports.getExclusiveSingle = (tableName, resourceId, resourceLocation, res) => {
  const query = `SELECT * FROM ${tableName} WHERE ${resourceLocation} = $1`;
  const value = [resourceId];
  pool.connect((err, client, done) => {
    client.query(query, value, (error, result) => {
      done();
      if (error) {
        res.status(400).send({ error });
      }
      if (result.rows < '1') {
        res.status(404).json({
          status: 'Failed',
          message: 'Resource not found',
        });
      } else {
        res.status(200).json({
          status: 'Success',
          message: 'Resource fetched successfully',
          data: result.rows,
        });
      }
    });
  });
};

exports.getSingle = (parentTable, childTable, parentResourceId, parentResourceLocation,
  childResourceLocation, res) => {
  const parentResourceValue = parentResourceId;
  const parentResourceQuery = `SELECT * FROM ${parentTable} WHERE ${parentResourceLocation} = $1 `;
  pool.connect((err, client, done) => {
    client.query(parentResourceQuery, [parentResourceValue], (error, result) => {
      done();
      if (error) {
        res.status(400).send({ error });
      }
      if (result.rows < '1') {
        res.status(404).json({
          status: 'Failed',
          message: 'Resource not found',
        });
      } else {
        const childResourceValue = parentResourceId;
        const childResourceQuery = `SELECT * FROM ${childTable} WHERE ${childResourceLocation} = $1`;
        client.query(childResourceQuery, [childResourceValue], (childError, childResult) => {
          done();
          if (childError) {
            res.status(400).send({ error });
          }
          res.status(200).json({
            status: 'Success',
            message: 'Resource fetched successfully',
            parentData: result.rows,
            childData: childResult.rows,
          });
        });
      }
    });
  });
};

exports.editQuestion = (tableName, id, data, res) => {
  const query = `UPDATE ${tableName} SET question_title=$2,question_description=$3 WHERE question_id = $1`;
  const values = [id, data.title, data.description];
  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
        editedQuestion: data,
      });
    });
  });
};

exports.deleteResource = (tableName, resourceId, resourceLocation, res) => {
  const query = `DELETE FROM ${tableName} WHERE ${resourceLocation} = $1`;
  const values = [resourceId];
  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).json({ error });
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
        deletedResource: result,
      });
    });
  });
};

exports.postQuestion = (data, res) => {
  const query = 'INSERT INTO questions(question_title,question_description,user_id) VALUES($1, $2, $3) RETURNING *';
  const values = [data.title, data.description, data.userId];

  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
        newQuestion: data,
      });
    });
  });
};

exports.postAnswer = (data, res) => {
  const query = 'INSERT INTO answers(question_id,answer_description, user_id) VALUES($1,$2,$3) RETURNING *';
  const values = [data.questionId, data.description, data.userId];
  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
        newAnswer: data,
      });
    });
  });
};

exports.editAnswer = (data, resourceId, res) => {
  const query = 'UPDATE answers SET answer_description=$2,user_id=$3 WHERE answer_id = $1';
  const values = [resourceId, data.description, data.userId];

  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
        editedAnswer: data,
      });
    });
  });
};

exports.upVote = (tableName, answerId, res) => {
  const query = `SELECT * From ${tableName} WHERE answer_id = $1 `;
  const values = [answerId];

  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      console.log(result.rows[0].upvote);
      const vote = result.rows[0].upvote + 1;
      const updateQuery = `UPDATE ${tableName} SET upvote=$1 where answer_id = $2`;
      const updateValue = [vote, answerId];
      client.query(updateQuery, updateValue, (upError, upResult) => {
        if (upError) {
          res.status(400).send(upError);
        }
        res.status(201).json({
          status: 'Success',
          message: 'Operation Successful',
        });
      });
    });
  });
};

exports.downVote = (tableName, answerId, res) => {
  const query = `SELECT * From ${tableName} WHERE answer_id = $1 `;
  const values = [answerId];

  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      console.log(result.rows[0].downvote);
      const vote = result.rows[0].downvote + 1;
      const updateQuery = `UPDATE ${tableName} SET downvote=$1 where answer_id = $2`;
      const updateValue = [vote, answerId];
      client.query(updateQuery, updateValue, (upError, upResult) => {
        if (upError) {
          res.status(400).send(upError);
        }
        res.status(201).json({
          status: 'Success',
          message: 'Operation Successful',
        });
      });
    });
  });
};

exports.accepter = (tableName, answerId, res) => {
  const updateQuery = `UPDATE ${tableName} SET accepted=$1 where answer_id = $2`;
  const updateValue = [1, answerId];
  pool.connect((err, client, done) => {
    client.query(updateQuery, updateValue, (upError, upResult) => {
      if (upError) {
        res.status(400).send(upError);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Operation Successful',
      });
    });
  });
};

exports.postReply = (data, res) => {
  const query = 'INSERT INTO replies(answer_id,reply_description, user_id) VALUES($1,$2,$3) RETURNING *';
  const values = [data.answerId, data.description, data.userId];
  pool.connect((err, client, done) => {
    client.query(query, values, (error, result) => {
      done();
      if (error) {
        res.status(400).send(error);
      }
      res.status(201).json({
        status: 'Success',
        message: 'Comment Submitted',
        newReply: data,
      });
    });
  });
};
