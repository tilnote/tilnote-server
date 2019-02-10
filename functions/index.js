const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const express = require('express');
const app = express();

const cors = require('cors')({ origin: true });
app.use(cors);

const checkUser = (req, res, next) => {
    if (req.query.auth_token === undefined) {
        next();
    } else {
        // verify user
        const idToken = req.query.auth_token;
        admin.auth().verifyIdToken(idToken)
            .then((decodedIdToken) => {
                const authUser = {
                    id: decodedIdToken.user_id,
                    name: decodedIdToken.name,
                    avatar: decodedIdToken.picture
                };
                req.user = authUser;
                next();
            }).catch((error) => {
                next();
            });
    }
};
app.use(checkUser);

function createCategory(cname){
    const categoriesRef = admin.database().ref('categories');
    const defaultData = `{
        "notes" : {
        }
    }`;
    categoriesRef.child(cname).set(JSON.parse(defaultData));
}

app.post('/categories', (req, res) => {
    const cname = req.body.cname;
    // TODO: implement below func
    createCategory(cname);

    res.header('Content-Type', 'application/json; charset=utf-8');
    res.status(201).json({ result: 'ok' });
});

app.get('/categories', (req, res) => {
    const categoriesRef = admin.database().ref('categories');
    categoriesRef.once('value', function (snapshot) {
        let items = new Array();
        snapshot.forEach(function (childSnapshot) {
            const cname = childSnapshot.key;
            items.push(cname);
        });

        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send({ categories: items });
    });
});

app.post('/categories/:cname/notes', (req, res) => {
    const cname = req.params.cname;
    const message = {
        date: new Date().toJSON(),
        body: req.body.body,
        user: req.user
    };
    const notesRef = admin.database().ref(`categories/${cname}/notes`);
    notesRef.push(message);

    res.header('Content-Type', 'application/json; charset=utf-8');
    res.status(201).send({ result: 'ok' });
});

app.get('/categories/:cname/notes', (req, res) => {
    const cname = req.params.cname;
    const notesRef = admin.database().ref(`categories/${cname}/notes`).orderByChild('date').limitToLast(20);
    notesRef.once('value', function(snapshot) {
        let items = new Array();
        snapshot.forEach(function(childSnapshot) {
            let note = childSnapshot.val();
            note.id = childSnapshot.key;
            items.push(note);
        });
        items.reverse();
        res.header('Content-Type', 'application/json; charset=utf-8');
        res.send({ notes: items });
    });
});

app.post('/reset', (req, res) => {
    createCategory('default');
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.status(201).send({ result: "ok" });
});

exports.v1 = functions.https.onRequest(app);