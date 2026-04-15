const express = require("express");
const cors = require("cors");
const fs = require("fs");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const schema = fs.readFileSync("./sql/schema.sql", "utf8");
db.exec(schema, () => console.log("✅ Database initialized"));

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email=?`, [email], (err, user) => {
        if (!user) return res.status(400).json({ error: "User not found" });
        if (user.password !== password)
            return res.status(400).json({ error: "Wrong password" });

        res.json({ message: "Login success", user });
    });
});

app.get("/categories", (req, res) => {
    db.all(`SELECT * FROM categories`, [], (err, rows) => res.json(rows));
});

app.post("/categories", (req, res) => {
    const { name } = req.body;

    db.run(`INSERT INTO categories(name) VALUES(?)`,
        [name],
        function (err) {
            if (err) return res.json({ error: "Category exists or invalid" });
            res.json({ id: this.lastID, name });
        }
    );
});

app.post("/categories/delete", (req, res) => {
    db.run(`DELETE FROM categories WHERE id=?`, [req.body.id], () => {
        res.json({ message: "Category deleted" });
    });
});

app.get("/topics", (req, res) => {
    db.all(`SELECT * FROM topics`, [], (err, rows) => res.json(rows));
});

app.post("/topics", (req, res) => {
    const { name, closure, finalClosure } = req.body;

    db.run(
        `INSERT INTO topics(name, closure, finalClosure) VALUES (?,?,?)`,
        [name, closure, finalClosure],
        function (err) {
            if (err) return res.json({ error: "Topic exists or invalid" });
            res.json({ id: this.lastID, name, closure, finalClosure });
        }
    );
});

app.post("/topics/delete", (req, res) => {
    db.run(`DELETE FROM topics WHERE id=?`, [req.body.id], () => {
        res.json({ message: "Topic deleted" });
    });
});

app.get("/ideas", (req, res) => {
    db.all(`
        SELECT ideas.*,
               categories.name AS category,
               topics.name AS topic,
               topics.finalClosure
        FROM ideas
        LEFT JOIN categories ON ideas.categoryId = categories.id
        LEFT JOIN topics ON ideas.topicId = topics.id
    `, [], (err, ideas) => {

        if (!ideas || ideas.length === 0) return res.json([]);

        let count = 0;

        ideas.forEach((idea, index) => {
            db.all(`
                SELECT * FROM comments WHERE ideaId=?
            `, [idea.id], (err2, comments) => {

                idea.comments = comments;

                count++;
                if (count === ideas.length) {
                    res.json(ideas);
                }
            });
        });
    });
});

app.post("/ideas", (req, res) => {
    const { title, content, category, topic } = req.body;

    db.get(`SELECT id FROM categories WHERE name=?`, [category], (err, cat) => {
    db.get(`SELECT id, closure FROM topics WHERE name=?`, [topic], (err2, tp) => {

        if (!cat || !tp)
            return res.json({ error: "Category or topic not found" });

        if (new Date() > new Date(tp.closure))
            return res.json({ error: "❌ Submission closed for this topic" });

        db.run(`
            INSERT INTO ideas(title, content, categoryId, topicId)
            VALUES (?,?,?,?)
        `, [title, content, cat.id, tp.id], function (err3) {

            res.json({
                id: this.lastID,
                title,
                content,
                category,
                topic
            });
        });

    })});
});

app.post("/ideas/react", (req, res) => {
    const { id, type, email } = req.body; // type = 'like' | 'dislike'

    db.get(
        `SELECT * FROM reactions WHERE userEmail=? AND ideaId=?`,
        [email, id],
        (err, row) => {

        if (!row) {
            db.run(`
                INSERT INTO reactions(userEmail, ideaId, reaction)
                VALUES (?, ?, ?)
            `, [email, id, type]);

            db.run(`
                UPDATE ideas SET ${type}s = ${type}s + 1 WHERE id=?
            `, [id]);

            return res.json({ status: "added", reaction: type });
        }

        if (row.reaction === type) {
            db.run(`DELETE FROM reactions WHERE id=?`, [row.id]);

            db.run(`
                UPDATE ideas SET ${type}s = ${type}s - 1 WHERE id=?
            `, [id]);

            return res.json({ status: "removed", reaction: "none" });
        }

        const opposite = row.reaction;

        db.run(`UPDATE reactions SET reaction=? WHERE id=?`, [type, row.id]);

        db.run(`
            UPDATE ideas
            SET ${type}s = ${type}s + 1,
                ${opposite}s = ${opposite}s - 1
            WHERE id=?
        `, [id]);

        return res.json({ status: "switched", reaction: type });
    });
});


app.post("/ideas/comment", (req, res) => {
    const { id, comment } = req.body;

    db.get(`
        SELECT topics.finalClosure 
        FROM ideas
        JOIN topics ON ideas.topicId = topics.id
        WHERE ideas.id=?
    `, [id], (err, row) => {

        if (!row) return res.json({ error: "Topic not found for idea" });

        if (new Date() > new Date(row.finalClosure))
            return res.json({ error: "❌ Comment period closed" });

        db.run(
            `INSERT INTO comments(ideaId, text) VALUES(?, ?)`,
            [id, comment],
            () => res.json({ success: true })
        );
    });
});

app.post("/comments/react", (req, res) => {
    const { commentId, type, email } = req.body;

    db.get(`
        SELECT * FROM commentReactions WHERE userEmail=? AND commentId=?
    `, [email, commentId], (err, row) => {

        if (!row) {
            db.run(`
                INSERT INTO commentReactions(userEmail, commentId, reaction)
                VALUES (?, ?, ?)
            `, [email, commentId, type]);

            db.run(`
                UPDATE comments SET ${type}s = ${type}s + 1 WHERE id=?
            `, [commentId]);

            return res.json({ status: "added", reaction: type });
        }

        if (row.reaction === type) {
            db.run(`DELETE FROM commentReactions WHERE id=?`, [row.id]);
            
            db.run(`
                UPDATE comments SET ${type}s = ${type}s - 1 WHERE id=?
            `, [commentId]);

            return res.json({ status: "removed", reaction: "none" });
        }

        const opposite = row.reaction;

        db.run(`UPDATE commentReactions SET reaction=? WHERE id=?`,
            [type, row.id]);

        db.run(`
            UPDATE comments 
            SET ${type}s = ${type}s + 1,
                ${opposite}s = ${opposite}s - 1
            WHERE id=?
        `, [commentId]);

        return res.json({ status: "switched", reaction: type });
    });
});


app.listen(3000, () => {
    console.log("✅ BACKEND + SQLITE running at http://localhost:3000");
});
