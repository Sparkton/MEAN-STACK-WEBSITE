const path = require("path");
const fs = require("fs");
const https = require("https");

const express = require("express");
//const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorController = require("./controllers/error");
const shopController = require("./controllers/shop");
const isAuth = require("./middleware/is-auth");
const User = require("./models/user");
//akashdubey1999

// const MONGODB_URI =
// `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.l7zs9.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;
const MONGODB_URI =
	"mongodb+srv://akash:akash@cluster0.l7zs9.mongodb.net/Project0?retryWrites=true&w=majority";

const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: "sessions",
});
const csrfProtection = csrf();

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "images");
	},
	filename: (req, file, cb) => {
		cb(null, new Date().getTime() + "-" + file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg" ||
		file.mimetype === "image/jpeg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(
	path.join(__dirname, "access.log"),
	{ flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(express.urlencoded({ extended: true }));
app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
	session({
		secret: "Big Secret",
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);

app.use(flash());

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	next();
});

app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}
	User.findById(req.session.user._id)
		.then((user) => {
			if (!user) {
				return next();
			}
			req.user = user;
			next();
		})
		.catch((err) => {
			next(new Error(err));
		});
});

app.post("/create-order", isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
	res.locals.csrfToken = req.csrfToken();
	next();
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
	res.status(500).render("500", {
		pageTitle: "Error Occured",
		path: "/500",
		isAuthenticated: req.session.isLoggedIn,
	});
});

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
	.then((result) => {
		//https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000);
		app.listen(process.env.PORT || 3000);
	})
	.catch((err) => {
		console.log(err);
	});
