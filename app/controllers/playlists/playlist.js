import Ember from 'ember';

export default Ember.Controller.extend({
  isNameEditor : false,
  sortProperties : ['sort:asc'],
  playlistItems : Ember.computed.sort('playlistItemsRaw', 'sortProperties'),
  remoteFile : null,
  isLoading : false,
  showBack : false,
  application: Ember.inject.controller(),
  player : Ember.inject.controller(),

  createItem : function(file, order) {
    let item =  {
        playlist : this.get('playlist.id'),
        name : file.name,
        isLocal : true,
        localPath : file.path,
        contentType: file.type,
        sort : order || 0
    };

    if (order !== 'undefined') {
      let cntr = 0;
      this.get('playlistItems').forEach((i) => {
        if (order === cntr) {
          cntr += 1;
        }
          i.set('sort', cntr);
          i.save();
          cntr += 1;

      });
    }

    this.store.createRecord('playlistItem', item).save();
    this.updatePlaylist();
  },


  saveItems : function(items) {
      items.forEach( i => {
        let item = this.store.peekRecord('playlistItem', i.id);
        item.set('sort', i.sort);
        item.save();
      });
  },

  saveMovedItem : function(id, order) {
    if (this.get('playlistItems.length') > 0) {
        let cntr = 0;
        this.get('playlistItems').forEach((i) => {
          if (order === cntr) {
            cntr += 1;
          }
            i.set('sort', cntr);
            i.save();
            cntr += 1;

        });
    }

    let item = this.store.peekRecord('playlistItem', id);
    item.set('sort', order);
    item.set('playlist', this.get('playlist.id'));
    item.save();

    this.updatePlaylist();

  },

  updatePlaylist : function() {
    this.send('resetRoute');
  },

  actions : {
    play : function(id) {
      this.get('player').send('play', id);
    },

    stop : function() {
      this.get('player').send('stop');
    },

    addRemoteFile: function() {
      this.set('isLoading', true);

        Ember.$.ajax({
          url : this.get('remoteFile'),
          type : 'HEAD',
          success : (r,e,q) => {
            let item =  {
                playlist : this.get('playlist.id'),
                name : this.get('remoteFile'),
                isLocal : false,
                remotePath : this.get('remoteFile'),
                contentType: q.getResponseHeader('Content-Type'),
                sort :  -1
            };

            this.store.createRecord('playlistItem', item).save();
            this.updatePlaylist();
            this.set('isLoading', false);
          },
          error : () => { this.set('isLoading', false); }
        });
    },

    renamePlaylist : function() {
      this.playlist.save();
      this.set('isNameEditor', false);
    },

    removeItem : function(item) {
      item.deleteRecord();
      item.save();
      let cntr = 0;
      this.get('playlistItems').forEach((i) => {
        if (item.get('id') !== i.get('id')) {
          i.set('sort', cntr);
          i.save();
          cntr += 1;
        }
      });

      this.updatePlaylist();
    },

    goPlaylists : function() {
      let dragDebounce =
        Ember.run.debounce(this, () => this.transitionToRoute('playlists'), 1000);
        this.set('application.playlistsDragOverdebounce', dragDebounce);
    },

    cancelGoPlaylists : function() {
      if (this.get('application.playlistsDragOverdebounce')) {
        Ember.run.cancel(this.get('application.playlistsDragOverdebounce'));
      }
    }

  },

  fileSelectionChanged : function(evt) {
    for (let i = 0; i < evt.target.files.length; i++) {
      Ums.__container__.lookup('controller:playlists.playlist').createItem(evt.target.files[i], 0 + i);
    }
  },

  itemMoved : function(id, order = 0) {
    Ums.__container__.lookup('controller:playlists.playlist').saveMovedItem(id, order);
  },

  fileDrop : function(evt, order = 0) {
    var item = evt.originalEvent.dataTransfer.getData('text/plain').split(',');

    if (item && item[0] === 'item') {
      Ums.__container__.lookup('controller:playlists.playlist').saveMovedItem(item[1], 0);
    } else {
      for (let i = 0; i < evt.dataTransfer.files.length; i++) {
        Ums.__container__.lookup('controller:playlists.playlist').createItem(evt.dataTransfer.files[i], order + i);
      }
    }
    evt.preventDefault();
    evt.stopPropagation();
  },

  reorderItems : function(items) {
    Ums.__container__.lookup('controller:playlists.playlist').saveItems(items);
  }
});
