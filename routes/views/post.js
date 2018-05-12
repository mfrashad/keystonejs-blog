var keystone = require('keystone');
var PostComment = keystone.list('PostComment');

exports = module.exports = function (req, res) {
	console.log('is this even working');
	var view = new keystone.View(req, res);
	var locals = res.locals;

	// Set locals
	locals.section = 'blog';
	locals.test='';
	locals.formData = req.body || {};
	locals.filters = {
		post: req.params.post,
	};
	locals.data = {
		posts: [],
	};

	view.on('post', {action: 'createComment'}, function (next) {
			console.log('post request');
			var newComment = new PostComment.model({
					state: 'published',
					post: locals.data.post.id,
					author: locals.user.id,
			});

			var updater = newComment.getUpdateHandler(req);

			updater.process(req.body, {
					fields: 'content',
					flashErrors: true,
					logErrors: true,
			}, function (err) {
					if (err) {
							console.log('comment error');
							locals.test = 'failed';
							locals.validationErrors = err.errors;
					} else {
							req.flash('success', 'Your comment was added.');
							console.log('comment success');
							locals.test = 'success';
							return res.redirect('/blog/post/' + locals.data.post.slug + '#comment-id-' + newComment.id);
					}
					next();
			});

	});

	// Load the current post
	
	view.on('init', function (next) {
		console.log('initializing');
		var q = keystone.list('Post').model.findOne({
			state: 'published',
			slug: locals.filters.post,
		}).populate('author categories');

		q.exec(function (err, result) {
			locals.data.post = result;
			next(err);
		});

	});

	
	// Load previous Post
	view.on('init', function (next) {

		var q = keystone.list('Post').model.findOne({state: "published", publishedDate: {$lt: locals.data.post.publishedDate}}).sort('-publishedDate').select('title slug');

		q.exec(function (err, results) {
			locals.data.prevPost = results;
			next(err);
		});

	});
	
	// Load next Post
	view.on('init', function (next) {

		var q = keystone.list('Post').model.findOne({state: "published", publishedDate: {$gt: locals.data.post.publishedDate}}).sort('-publishedDate').select('title slug');

		q.exec(function (err, results) {
			locals.data.nextPost = results;
			next(err);
		});

	});

	// Load comments on the Post
	
	view.on('init', function (next) {
		keystone.list('PostComment').model.find()
			.where('post', locals.data.post)
			.where('commentState', 'published')
			.where('author').ne(null)
			.populate('author', 'name image')
			.sort('+publishedOn')
			.exec(function (err, comments) {
					if (err) return res.err(err);
					if (!comments) return res.notfound('Post comments not found');
					locals.data.comments = comments;
					next();
			});
	});
	

	// Create a Comment
	

	// Delete a Comment
	/*
	view.on('get', {remove: 'comment'}, function (next) {
		
				if (!req.user) {
						req.flash('error', 'You must be signed in to delete a comment.');
						return next();
				}
			
				keystone.list('PostComment').model.findOne({
						_id: req.query.comment,
						post: locals.post.id,
				})
				.exec(function (err, comment) {
						if (err) {
								if (err.name === 'CastError') {
										req.flash('error', 'The comment ' + req.query.comment + ' could not be found.');
										return next();
								}
								return res.err(err);
						}
						if (!comment) {
								req.flash('error', 'The comment ' + req.query.comment + ' could not be found.');
								return next();
						}
						if (comment.author != req.user.id) {
								req.flash('error', 'Sorry, you must be the author of a comment to delete it.');
								return next();
						}
						comment.commentState = 'archived';
						comment.save(function (err) {
								if (err)
										return res.err(err);
								req.flash('success', 'Your comment has been deleted.');
								return res.redirect('/blog/post/' + locals.data.post.slug);
						});
				});
	});
	*/

	// Render the view
	view.render('post');
};
