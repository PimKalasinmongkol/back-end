const express = require('express')
const cors = require('cors')
const path = require('path')
const session = require('express-session')
const morgan = require('morgan')
const multer = require('multer')
const app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(morgan('dev'))

const mysql = require('mysql2');
// create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bluebird_db'
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname ,'../BlueBirdNew/image/upload'))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage })

var user_session = null;

app.get('/api/user_table', function (req, res, next) {
    // simple query
    connection.query(
        'SELECT * FROM user',
        function (err, results, fields) {
            console.log(results)
            console.log(fields)
            res.json(results)
        }
    );
})

// ? User Data

app.post('/editUser/:userId' ,(request ,response) => {
    const user_id = request.params.userId;
    const { email, password, name } = request.body
    connection.query("UPDATE user SET email =?, password =?, name =? WHERE id =?", [email, password, name, user_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})


app.get('/getEditWithUserId', (request, response) => {
    const user_id = user_session;
    console.log('Pim1',user_id)
    connection.query("SELECT * FROM user WHERE id = ?", [user_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})

app.post('/createAccount', (request, response) => {
    const { email, password, name } = request.body
    connection.query("INSERT INTO user (email,password,photoURL,name) VALUES (?,?,?,?)", [email, password, 'https://i.ibb.co/9ZYpKN3/pim1.jpg', name], (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
});

// ? Fetch Post

app.post('/createPost' ,upload.single('image') ,(req ,res) => {
    const user_id = user_session;
    const post_title = req.body.title;
    const image = req.file.originalname

    connection.query('INSERT INTO `post`(`user_id`, `post_title`, `post_img`, `post_date`) VALUES (? ,? ,? ,NOW())',[user_id, post_title, image], (error, results) => {
        if (error) throw error
        res.status(200).json(results)
    })
})

app.post('/editPost' ,upload.single('image') ,(req ,res) => {
    const post_id = req.body.id;
    const post_title = req.body.title;
    const image = req.file.originalname;

    if (image.length == 0 || image == null || image == undefined) {
        connection.query("UPDATE post SET post_title =? WHERE post_id =?", [post_title, post_id], (error, results, fields) => {
            if (error) throw error
            res.status(200).json(results)
        })
    } else {
        connection.query("UPDATE post SET post_title =?, post_img =? WHERE post_id =?", [post_title, image, post_id], (error, results, fields) => {
            if (error) throw error
            res.status(200).json(results)
        })
    }

})

app.get('/getPost', (request, response) => {//:user_id
    const user_id = user_session;
    console.log('Pim',user_id)
    //"SELECT * FROM post INNER JOIN user ON post.user_id = user.id WHERE user_id =?"
    connection.query("SELECT post.*, user.photoURL, user.name FROM post INNER JOIN user ON post.user_id = user.id", [user_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})

app.get('/getPostsByUser', (request, response) => {
    const user_id = user_session
    //"SELECT * FROM post INNER JOIN user ON post.user_id = user.id WHERE user_id =?"
    connection.query("SELECT post.*, user.photoURL, user.name FROM post INNER JOIN user ON post.user_id = user.id WHERE user_id = ?", [user_id], (error, results, fields) => {
        if (error) throw error
        console.log('Earth',results)
        response.status(200).json(results)
    })
})

// ? Like

app.get('/getLikes', (request, response) => {
    connection.query("SELECT * FROM post_like",(error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})

app.post('/addLike' ,(request ,response) => {
    const user_id = request.body.user_id;
    const post_id = request.body.post_id;
    
    connection.query('INSERT INTO `post_like`(`user_id`, `post_id`, `like_date`) VALUES (?,?,NOW());',[user_id, post_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json({
            message: 'Like added successfully'
        })
    })
})

app.post('/undoLike', (request, response) => {
    const user_id = request.body.user_id;
    const post_id = request.body.post_id;
    
    connection.query('DELETE FROM `post_like` WHERE user_id =? AND post_id =? ',[user_id, post_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json({
            message: 'Like removed successfully'
        })
    })
})

// ? Comment
app.get('/getComment', function (request, response) {
    connection.query("SELECT * FROM `post_comment` INNER JOIN `user` ON user.id = post_comment.user_id ORDER BY comment_id DESC",(error, results, fields) => {
        if (error) throw error
        response.status(200).json(results)
    })
})


app.post('/addComment' ,(request ,response) => {
    const user_id = request.body.user_id;
    const post_id = request.body.post_id;
    const comment = request.body.comment;
    
    connection.query('INSERT INTO `post_comment`(`user_id`, `post_id`, `comment_content`, `comment_date`) VALUES (?,?,?,NOW());',[user_id, post_id, comment], (error, results, fields) => {
        if (error) throw error
        response.status(200).json({
            message: 'Comment added successfully'
        })
    })
})

app.post('/deleteComment',(request ,response) => {
    const comment_id = request.body.comment_id;
    
    connection.query('DELETE FROM `post_comment` WHERE comment_id = ? ',[comment_id], (error, results, fields) => {
        if (error) throw error
        response.status(200).json({
            message: 'Comment removed successfully'
        })
    })
})

// ? Login Register Session

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(email, password);
    // Query the database to find the user by username
    connection.query(
        'SELECT * FROM user WHERE email=? AND password=?',
        [email, password],
        (err, results) => {
            if (err) {
                res.status(500).json({ message: 'Error retrieving user' });
                return;
            }
            user_session = results[0].id;
            res.status(200).json(results)
        }
    );
});

app.get('/session' ,(req ,res) => {
    let user_id = user_session;
    console.log('NUT',user_id)
    connection.query(
        'SELECT * FROM user WHERE id = ?',
        [user_id],
        (err, results) => {
            if (err) {
                res.status(500).json({ message: 'Error retrieving user' });
                return;
            }
            res.status(200).json(results)
        }
    );
    /*
    response.status(200).json({
        userId : user_id
    });*/
})

app.get('/logout',(request,response) => {
    user_session = null;
    console.log("Logout : " + user_session);
    response.status(200).json({
        message: 'Successfully logged out'
    });
})

app.listen(4000, function () {
    console.log('CORS-enabled web server listening on port 4000')
})