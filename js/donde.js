(function($) {

window.Donde = {
  Models: {},
  Collections: {},
  Views: {},
  Instances: {
    markers: [],
    rendered_markers: []
  },
  Settings: {
    BackendURL: {
      Places: '', // Url to fetch the Places.
      Categories: '', // Url to fetch the Categories.
      Relations: '' // Url to fetch the relations between Categories and Places.
    },
    BackendType: 'dynamic', // Allowed types: 'dynamic', 'static'.
    MarkersPath: 'images',
    Map: {
      center: new google.maps.LatLng(-32.953843, -60.661197),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      el: '#map',
      zoomControl : true,
      zoomControlOpt: {
        style : 'SMALL',
        position: 'TOP_LEFT'
      },
      panControl : false,
      streetViewControl : false,
      mapTypeControl: false,
      overviewMapControl: false
    }
  },
  Status: {
    PlacesLoaded: false,
    CategoriesLoaded: false,
    RelationsLoaded: false
  }
};

/**
 * Begin of Places related objects.
 */
Donde.Models.Place = Backbone.Model.extend({});

Donde.Collections.Places = Backbone.Collection.extend({
  model: Donde.Models.Place,
  url: function() {
    return Donde.Settings.BackendURL.Places
  }
});
/**
 * End of Places related structures.
 */


/**
 * Begin of Categories related objects.
 */
Donde.Models.Category = Backbone.Model.extend({});

Donde.Collections.Categories = Backbone.Collection.extend({
  model: Donde.Models.Category,
  url: function() {
    if (Donde.Settings.BackendType == 'dynamic') {
      return Donde.Settings.BackendURL.Categories + '/' + this.category;
    }
    else {
      return Donde.Settings.BackendURL.Categories + '.' + this.category + '.json';
    }
  },

  initialize: function(models, options) {
    this.category = options.category;
  },
});

Donde.Views.Category = Backbone.View.extend({
  tagName: 'li',

  template: _.template("<input type='checkbox' id='category-<%= id %>'></input><label for='category-<%= id %>''><%= name %></label>"),

  events: {
    'click input': "checkboxClick"
  },

  checkboxClick: function(e) {
    category_id = this.model.id;
    if (Donde.Instances.markers[category_id] === undefined) {
      Donde.Instances.markers[category_id] = [];
      if (Donde.Instances.Relations.contains(category_id)) {
        var relations = Donde.Instances.Relations.get(category_id).toJSON();
        for (var i = 0; i < relations.places.length; i++) {
          var place = Donde.Instances.PlaceCollections.get(relations.places[i]).toJSON();
          var point = {
            position: new google.maps.LatLng(place.lat, place.lng),
            map: Donde.Instances.map,
            title: place.name,
            icon: Donde.Settings.MarkersPath + '/' + Donde.Instances.CategoryCollection.get(category_id).toJSON().color.replace('#', '') + '.png',
            id: place.id,
            click: Donde.markerClick,
          };
          Donde.Instances.markers[category_id][i] = point;
        }
      };
    }

    if ($(e.target).is(":checked")) {
      Donde.Instances.rendered_markers[category_id] = [];
      for (var i = 0; i < Donde.Instances.markers[category_id].length; i++) {
        Donde.Instances.rendered_markers[category_id][i] = new google.maps.Marker(Donde.Instances.markers[category_id][i]);
      };
    }
    else {
      for (var i = 0; i < Donde.Instances.rendered_markers[category_id].length; i++) {
        Donde.Instances.rendered_markers[category_id][i].setMap(null);
      };
    }
  },

  render: function() {
    this.$el.html( this.template( this.model.toJSON() ));
    return this;
  }
});

Donde.Views.Categories = Backbone.View.extend({
  tagName: 'ul',

  render: function() {
    this.collection.each(this.addOne, this);
    return this;
  },

  addOne: function(category) {
    var categoryView = new Donde.Views.Category( {model: category});
    this.$el.append( categoryView.render().el );
  }
});
/**
 * End of Categories related structures.
 */

/**
 * Begin of Relations related structures.
 */
Donde.Models.Relation = Backbone.Model.extend({});
Donde.Collections.Relations = Backbone.Collection.extend({
  model: Donde.Models.Relation,
  url: function() {
    if (Donde.Settings.BackendType == 'dynamic') {
      return Donde.Settings.BackendURL.Relations + '/' + this.category;
    }
    else {
      return Donde.Settings.BackendURL.Relations + '.' + this.category + '.json';
    }
  },

  initialize: function(models, options) {
    this.category = options.category;
  },

  contains: function(id) {
    return this.get(id) != undefined
  }
});
/**
 * End of Relations related structures.
 */


Donde.Views.Map = Backbone.View.extend({
  id: "map",

  render: function() {
    Donde.Instances.map = new google.maps.Map($(Donde.Settings.Map.el).get(0), Donde.Settings.Map);

    return Donde.Instances.map;
  }
});

// Event handler when a marker is clicked.
Donde.markerClick = function(e) {

}

// Starts the Donde application.
Donde.start = function() {
  var category_name = $("#category-list").attr("category");

  var mapView = new Donde.Views.Map();
  mapView.render();

  Donde.Instances.CategoryCollection = new Donde.Collections.Categories({}, { category: category_name});
  Donde.Instances.CategoryCollection.fetch().then(function() {
    Donde.Status.CategoriesLoaded = true;
    Donde.tryStart();
  });

  Donde.Instances.PlaceCollections = new Donde.Collections.Places();
  Donde.Instances.PlaceCollections.fetch().then(function() {
    Donde.Status.PlacesLoaded = true;
    Donde.tryStart();
  });

  Donde.Instances.Relations = new Donde.Collections.Relations({}, { category: category_name});
  Donde.Instances.Relations.fetch().then(function(){
    Donde.Status.RelationsLoaded = true;
    Donde.tryStart();
  });
}

// Check if all the information is ready to start using the App.
Donde.tryStart = function() {
  if (Donde.Status.PlacesLoaded && Donde.Status.RelationsLoaded && Donde.Status.CategoriesLoaded) {
    Donde.Instances.categoryView = new Donde.Views.Categories({ collection: Donde.Instances.CategoryCollection });
    $("#category-list").append(Donde.Instances.categoryView.render().el);
    Donde.appStarted();
  }
}

Donde.appStarted = function() {

}

})(jQuery);
