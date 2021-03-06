/*!
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License, version 2.1 as published by the Free Software
 * Foundation.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this
 * program; if not, you can obtain a copy at http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 * or from the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * Copyright (c) 2002-2013 Pentaho Corporation..  All rights reserved.
 */

pen.define([
  "common-ui/util/HandlebarsCompiler",
  "common-ui/bootstrap",
  "common-ui/jquery"
], function (HandlebarsCompiler) {


  function init(context) {
    var favoriteControllerConfig = {
      favoritesDisabled: false,
      recentsDisabled: false,
      i18nMap: context.i18n,

    };

    var createNewConfig = {
      canAdminister: context.canAdminister,
      hasMarketplacePlugin: context.hasMarketplacePlugin,
      i18nMap: context.i18n
    };


    // Set disabled = true for
    var disabledWidgetIdsArr = context.config.disabled_widgets.split(",");
    $.each(disabledWidgetIdsArr, function (index, value) {

      if (value == "favorites" || value == "recents") {
        favoriteControllerConfig.favoritesDisabled = true;
      }
    });

    initFavoritesAndRecents(favoriteControllerConfig);

    // Process and inject all handlebars templates, results are parented to
    // the template's parent node.
    HandlebarsCompiler.compileScripts(context, function (compiledContent, jScriptEle) {
      var html = $(compiledContent);
      var widgetId = html.attr("id");
      if (widgetId && $.inArray(widgetId, disabledWidgetIdsArr) != -1) {
        return;
      }

      jScriptEle.parent().append(html);
    });

    // Require getting-started widget if it has not been disabled
    if ($("#getting-started").length > 0) {
      pen.require(["home/gettingStarted"], function (gettingStarted) {
        gettingStarted.init();
      });
    }

    // Handle the new popover menu. If we add another, make generic
    pen.require(["home/createNew"], function (createNew) {
      createNew.buildContents(createNewConfig, function ($contents) {
        var result = "";
        for (var i = 0; i < $contents.length; i++) {
          result += $contents[i][0].outerHTML;
        }
        $("#btnCreateNewContent").append($(result));
      });
    });

    $("#btnCreateNew").popover({
      'html': true,
      content: function () {
        return $('#btnCreateNewContent').html();
      }
    });

  }

  function openFile(title, tooltip, fullPath) {
    if (parent.mantle_setPerspective && window.parent.openURL) {
      // show the opened perspective
      parent.mantle_setPerspective('opened.perspective');
      window.parent.openURL(title, tooltip, fullPath);
    }
  }

  function openRepositoryFile(path, mode) {
    if (!path) {
      return;
    }
    if (!mode) {
      mode = "edit";
    }

    // show the opened perspective
    var extension = path.split(".").pop();

    if (!($("body").hasClass("IE") && extension == "pdf")) {
      parent.mantle_setPerspective('opened.perspective');
    }
    window.parent.mantle_openRepositoryFile(path, mode);
  }

  function initFavoritesAndRecents(config) {
    pen.require(["home/FavoritesController"], function (FavoritesController) {
      controller = new FavoritesController(config);
    });
  }

  function getUrlBase() {
    return window.location.pathname.substring(0, window.location.pathname.indexOf("/mantle/home")) + "/";
  }

  function getContent(serviceUrl, successCallback, errorCallback, beforeSendCallback) {
    var now = new Date();
    $.ajax({
      url: serviceUrl + "?ts=" + now.getTime(),
      success: function (result) {
        if (successCallback) {
          successCallback(result);
        }
      },
      error: function (err) {
        console.log(err);
        if (errorCallback) {
          errorCallback(err);
        }
      },
      beforeSend: function () {
        if (beforeSendCallback) {
          beforeSendCallback();
        }
      }
    });
  }

  return {
    getUrlBase: getUrlBase,
    getContent: getContent,
    openFile: openFile,
    openRepositoryFile: openRepositoryFile,
    init: init
  }
});

var controller = undefined;

/**
 * this gets triggered when the Home perspective becomes active, must be globally available to get called
 */
function perspectiveActivated() {
  if (controller) {
    controller.refreshAll();
  }
}

