define(['backbone', 'Workspace', 'ConnectionView', 'NodeViewTypes'], function(Backbone, Workspace, ConnectionView, NodeViewTypes){

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace_container row scroll-x scroll-y',

    initialize: function(atts) { 

      this.app = this.model.app;

      this.$workspace = $('<div/>', {class: 'workspace scroll-x scroll-y'});
      this.$workspace_back = $('<div/>', {class: 'workspace_back scroll-x scroll-y'});
      this.$workspace_canvas = $('<svg class="workspace_canvas scroll-x scroll-y" xmlns="http://www.w3.org/2000/svg" version="1.1" />');

      this.$el.append( this.$workspace );
      this.$workspace.append( this.$workspace_back );
      this.$workspace.append( this.$workspace_canvas );

      this.listenTo(this.model, 'change', this.render );
      this.listenTo(this.model, 'change:current', this.onChangeCurrent );

      this.listenTo(this.model, 'startProxyDrag', this.startProxyDrag);
      this.listenTo(this.model, 'endProxyDrag', this.endProxyDrag);

      this.renderProxyConnection();
      
    },

    onChangeCurrent: function() {

    },

    events: {
      'click .workspace_back':  'deselectAll',
      'dblclick .workspace_back':  'showNodeSearch'
    },

    nodeViews: {},
    connectionViews: {},

    render: function() {

      // check if zoom has changed
      // if (this.model.changed.zoom){
      //   this.$workspace.css('-webkit-transform', 'scale('+this.model.get('zoom')+')');
      //   console.log('render zoom')
      //   return this;
      // }

      // console.log('render normal')

      this.clearWorkspace();
      this.renderNodes();
      this.renderConnections();

      return this;

    },

    showNodeSearch: function(e){
      this.app.set('searching', true);
      this.app.newNodePosition = [e.offsetX, e.offsetY];
    },

    startProxyDrag: function(event){
      this.$workspace.bind('mousemove', $.proxy( this.proxyDrag, this) );
      this.$workspace.bind('mouseup', $.proxy( this.endProxyDrag, this) );
    },

    endProxyDrag: function(event){
      this.$workspace.unbind('mousemove', this.proxyDrag);
      this.$workspace.unbind('mouseup', this.endProxyDrag);
      this.model.endProxyConnection();
    },

    proxyDrag: function(event){
      var offset = this.$workspace.offset()
        , posInWorkspace = [event.pageX - offset.left, event.pageY - offset.top];
      this.model.proxyConnection.set('endProxyPosition', posInWorkspace);
    },

    renderProxyConnection: function() {

      var view = new ConnectionView({ 
        model: this.model.proxyConnection, 
        workspaceView: this, 
        workspace: this.model, 
        isProxy: true
      });

      view.render();
      this.$workspace_canvas.prepend( view.el );
    },

    clearWorkspace: function() {
      this.clearDeadNodes();
      this.clearDeadConnections();
    },

    renderNodes: function() {

      var that = this;

      this.model.get('nodes').forEach(function(nodeModel) {

        var nodeView = that.nodeViews[nodeModel.get('_id')];

        if ( nodeView === undefined){

          var NodeView = NodeViewTypes.Base;
          if ( NodeViewTypes[ nodeModel.get('typeName') ] != undefined)
          {
            NodeView = NodeViewTypes[ nodeModel.get('typeName') ];
          }
          nodeView = new NodeView({ model: nodeModel, workspaceView: that, workspace: that.model });
        
        }

        that.$workspace.prepend( nodeView.$el );
        nodeView.render();
        nodeView.makeDraggable();
        nodeView.delegateEvents();
        that.nodeViews[ nodeView.model.get('_id') ] = nodeView;
        that.$workspace_canvas.append( nodeView.portGroup );

      });

    },

    renderConnections: function() {

      var that = this;

      this.model.get('connections').forEach( function( cntn ) {

        var view = that.connectionViews[cntn.get('_id')]

        if ( that.connectionViews[cntn.get('_id')] === undefined){
          view = new ConnectionView({ model: cntn, workspaceView: that, workspace: that.model });
        }

        view.delegateEvents();

        if (!view.el.parentNode){
          view.render();
          that.$workspace_canvas.prepend( view.el );

          that.connectionViews[ view.model.get('_id') ] = view;
        }

      });
    },

    clearDeadNodes: function() {
      for (var key in this.nodeViews){
        if (this.model.get('nodes').get(key) === undefined){
          this.nodeViews[key].remove();
        }
      }

    },

    clearDeadConnections: function() {
      for (var key in this.connectionViews){
        if (this.model.get('connections').get(key) === undefined){
          this.connectionViews[key].remove();
        }
      }
    },

    deselectAll: function() {
      this.model.get('nodes').deselectAll();
    },

  });
});
