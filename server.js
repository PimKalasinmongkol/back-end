const express = require('express')
const cors = require('cors')
const app = express()
app.use(express.json())
app.use(cors())

const mysql = require('mysql2');
// create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bluebird_db'
});


app.post('/createAccount', (request, response) => {
    const { email, password, name } = request.body
    connection.query("INSERT INTO user (email,password,photoURL,name) VALUES (?,?,?,?)", [email, password, 'https://i.ibb.co/9ZYpKN3/pim1.jpg', name], (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
});

app.get('/api/user_table', function (req, res, next) {
    // simple query
    connection.query(
        'SELECT * FROM user',
        function (err, results, fields) {
            console.log(results);
            console.log(fields);
            res.json(results)

        }
    );

})

app.get('/getPostWithUserId', (request, response) => {
    connection.query("SELECT * FROM post INNER JOIN user ON post.user_id = user.id", (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Query the database to find the user by username
    connection.query(
        'SELECT * FROM user WHERE email=? AND password=?',
        [email, password],
        (err, results) => {
            if (err) {
                res.status(500).json({ message: 'Error retrieving user' });
                return;
            }
            res.status(200).json(results)
        }
    );
});

app.listen(4000, function () {
    console.log('CORS-enabled web server listening on port 4000')
})