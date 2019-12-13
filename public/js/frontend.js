var ampp = {
	grid : document.getElementById('gallery'),
	gallery : [],
	imgSet : 0,
	imgLoaded : 0,
	initGrid : function() {
		console.log("initGrid!");
		ampp.grid = $('#gallery');
		ampp.grid.isotope({
		  itemSelector: '.grid-item',
		  percentPosition: true,
		  masonry: {
				columnWidth: '.grid-sizer',
		  }
		});

		ampp.grid.on( 'click', '.item-expand', function() {
		  $(this).toggleClass('gigante');
		  ampp.grid.isotope('layout');
		});
	}
};

(function(w, d){
	if (!ampp.grid) return false;
	var b = d.getElementsByTagName('body')[0];
	var s = d.createElement("script");
	// s.async = false;
	var v = !("IntersectionObserver" in w) ? "8.7.1" : "10.5.2";
	s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/" + v + "/lazyload.min.js";
	w.lazyLoadOptions = {
		container : ampp.grid,
		elements_selector : 'img',
		/*
		callback_enter : function() {
			console.log('can now load');
		},
		*/
		callback_set : function (el) {
			ampp.imgSet++;
		},
		callback_load : function(el) {
			console.log( 'img loaded: ' + el.clientWidth + 'x' + el.clientHeight + ' ' + el.src);
			ampp.imgLoaded++;
			if (!ampp.grid.isotope) {
				ampp.initGrid();
			} else {
				//if (ampp.imgLoaded == ampp.imgSet) {
				ampp.grid.isotope('layout');
			}
		}
	};
	b.appendChild(s);
}(window, document));

$(document).ready(function () {
	console.log("dom ready!");

	$('.like-button').bind('click', function () {
		var that = this;
		var html = 'liked';
		that.innerHTML = html;
		$.ajax({
			type: "PUT",
			url: "/contents/" + that.dataset.id + "/like",
			timeout: 2000000,
			success: function (data) {
				//show content
				var text = (data.likeCount === 1) ? ' Like' : ' Likes';
				html = data.likeCount + text
				that.innerHTML = html;

				if (that.dataset.liked === 'true' || that.dataset.liked === true) {
					$('#'+that.dataset.id).removeClass('btn-action');
					$('#'+that.dataset.id).addClass('btn-social');
					that.dataset.liked = false;
				} else if (that.dataset.liked === 'false' || that.dataset.liked === false) {
					$('#'+that.dataset.id).addClass('btn-action');
					$('#'+that.dataset.id).removeClass('btn-social');

					that.dataset.liked = true;
				}
			},
			error: function (jqXHR, textStatus, err) {
				//show error message
				alert('text status ' + textStatus + ', err ' + err)
			}
		});
	});

	$('.btn-danger').on('click', function(){
		var result = confirm("Are you sure you want to delete this?");
		if (!result) {
		    return false;
		}
		console.log('deleting');
	})

	$('.follow-button').bind('click', function () {
		var that = this;
		var html = 'loading ...'
        // that.innerHTML = html;

        if (that.dataset.followed === 'true' || that.dataset.followed === true) {
            $('#'+that.dataset.id).removeClass('btn-action');
						$('#'+that.dataset.id).addClass('btn-social');
            that.dataset.followed = false;
            that.innerHTML = 'Follow';
        } else if (that.dataset.followed === 'false' || that.dataset.followed === false) {
					$('#'+that.dataset.id).addClass('btn-action');
					$('#'+that.dataset.id).removeClass('btn-social');
            that.dataset.followed = true;
            that.innerHTML = 'Following';
        }

		$.ajax({
			type: "PUT",
			url: "/users/" + that.dataset.id + "/follow",
			timeout: 2000000,
			success: function (data) {
                console.log(data);
			},
			error: function (jqXHR, textStatus, err) {
				//show error message
                // alert('text status ' + textStatus + ', err ' + err)

                if (that.dataset.followed === 'false' || that.dataset.followed === false) {
									$('#'+that.dataset.id).addClass('btn-action');
									$('#'+that.dataset.id).removeClass('btn-social');
                    that.dataset.followed = false;
                    that.innerHTML = 'Follow';
				} else if (that.dataset.followed === 'true' || that.dataset.followed === true) {
					$('#'+that.dataset.id).removeClass('btn-action');
					$('#'+that.dataset.id).addClass('btn-social');
					that.dataset.followed = true;
                    that.innerHTML = 'Following';
                }
			}
		});

	});
});
