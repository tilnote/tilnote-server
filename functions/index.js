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