/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Sage.
 *
 * The Initial Developer of the Original Code is
 * Peter Andrews <petea@jhu.edu>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Peter Andrews <petea@jhu.edu>
 * Erik Arvidsson <erik@eae.net>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var sageFolderID;

var chkUserCssEnable;
var txtUserCssPath;
var chkAllowEContent;
var chkAutoFeedTitle;
var chkRenderFeeds;
var chkTwelveHourClock;
var feedItemOrder;
var feedDiscoveryMode;

var gList;
var gNameArc;
var strRes;

function init() {
	initServices();
	initBMService();

	strRes = document.getElementById("strRes");

	var header = document.getElementById("header");
	header.setAttribute("description", header.getAttribute("description") + " " + CommonFunc.versionString(CommonFunc.VERSION, 1));

  sageFolderID = CommonFunc.getPrefValue(CommonFunc.FEED_FOLDER_ID, "str", "NC:BookmarksRoot");
	gNameArc = RDF.GetResource(NC_NS + "Name");
	gList = document.getElementById("select-menu");

	chkUserCssEnable = document.getElementById("chkUserCssEnable");
	chkUserCssEnable.checked = CommonFunc.getPrefValue(CommonFunc.USER_CSS_ENABLE, "bool", false);

	txtUserCssPath = document.getElementById("txtUserCssPath");
	txtUserCssPath.value = CommonFunc.getPrefValue(CommonFunc.USER_CSS_PATH, "wstr", "");

	chkAllowEContent = document.getElementById("chkAllowEContent");
	chkAllowEContent.checked = CommonFunc.getPrefValue(CommonFunc.ALLOW_ENCODED_CONTENT, "bool", true);

	chkAutoFeedTitle = document.getElementById("chkAutoFeedTitle");
	chkAutoFeedTitle.checked = CommonFunc.getPrefValue(CommonFunc.AUTO_FEED_TITLE, "bool", true);

	chkRenderFeeds = document.getElementById("chkRenderFeeds");
	chkRenderFeeds.checked = CommonFunc.getPrefValue(CommonFunc.RENDER_FEEDS, "bool", true);

	chkTwelveHourClock = document.getElementById("chkTwelveHourClock");
	chkTwelveHourClock.checked = CommonFunc.getPrefValue(CommonFunc.TWELVE_HOUR_CLOCK, "bool", false);

	feedItemOrder = document.getElementById("feedItemOrder");
	feedItemOrder.value = CommonFunc.getPrefValue(CommonFunc.FEED_ITEM_ORDER, "str", "chrono");

	feedDiscoveryMode = document.getElementById("feedDiscoveryMode");
	feedDiscoveryMode.value = CommonFunc.getPrefValue(CommonFunc.FEED_DISCOVERY_MODE, "str", "exhaustive");

	setDisabled();

	setTimeout(fillSelectFolderMenupopup, 0);
}

function accept() {
	CommonFunc.setPrefValue(CommonFunc.FEED_FOLDER_ID, "str", sageFolderID);
	CommonFunc.setPrefValue(CommonFunc.USER_CSS_ENABLE, "bool", chkUserCssEnable.checked);
	CommonFunc.setPrefValue(CommonFunc.USER_CSS_PATH, "wstr", txtUserCssPath.value);
	CommonFunc.setPrefValue(CommonFunc.ALLOW_ENCODED_CONTENT, "bool", chkAllowEContent.checked);
	CommonFunc.setPrefValue(CommonFunc.AUTO_FEED_TITLE, "bool", chkAutoFeedTitle.checked);
	CommonFunc.setPrefValue(CommonFunc.RENDER_FEEDS, "bool", chkRenderFeeds.checked);
	CommonFunc.setPrefValue(CommonFunc.TWELVE_HOUR_CLOCK, "bool", chkTwelveHourClock.checked);
	CommonFunc.setPrefValue(CommonFunc.FEED_ITEM_ORDER, "str", feedItemOrder.value);
	CommonFunc.setPrefValue(CommonFunc.FEED_DISCOVERY_MODE, "str", feedDiscoveryMode.value);
}

function selectFolder(aEvent){
	sageFolderID = aEvent.target.id;
}

function setDisabled() {
	txtUserCssPath.disabled = !chkUserCssEnable.checked;
	document.getElementById("btnBrowseCss").disabled = !chkUserCssEnable.checked;
}

function browseCss() {
	var fpicker = Components.classes["@mozilla.org/filepicker;1"]
					.createInstance(Components.interfaces.nsIFilePicker);
	fpicker.init(window, strRes.getString("css_select_file"), fpicker.modeOpen);
	fpicker.appendFilter(strRes.getString("css_css_file") + " (*.css)", "*.css");
	fpicker.appendFilters(fpicker.filterAll);

	var showResult = fpicker.show();
	if(showResult == fpicker.returnOK) {
		txtUserCssPath.value = fpicker.file.path;
	}
}

function fillSelectFolderMenupopup () {
	var popup = document.getElementById("select-folder");

	// clearing the old menupopup
	while (popup.hasChildNodes()) {
		popup.removeChild(popup.firstChild);
	}

	// to be removed once I checkin the top folder
	var element = document.createElementNS(XUL_NS, "menuitem");
	element.setAttribute("label", "Bookmarks");
	element.setAttribute("id", "NC:BookmarksRoot");
	popup.appendChild(element);

	var folder = RDF.GetResource("NC:BookmarksRoot");
	fillFolder(popup, folder, 1);
	if(gList.selectedIndex == -1) {
		gList.selectedIndex = 0;
		sageFolderID = "NC:BookmarksRoot";
	}
}

function fillFolder(aPopup, aFolder, aDepth) {
	RDFC.Init(BMDS, aFolder);
	var children = RDFC.GetElements();
	while (children.hasMoreElements()) {
		var curr = children.getNext();
		if (RDFCU.IsContainer(BMDS, curr)) {
			curr = curr.QueryInterface(Components.interfaces.nsIRDFResource);
			var element = document.createElementNS(XUL_NS, "menuitem");
			var name = BMDS.GetTarget(curr, gNameArc, true).QueryInterface(kRDFLITIID).Value;
			var indentation = new Array(aDepth + 1).join("   ");
			element.setAttribute("label", indentation + name);
			element.setAttribute("id", curr.Value);
			aPopup.appendChild(element);
			if (curr.Value == sageFolderID) {
				gList.selectedItem = element;
			}
			fillFolder(aPopup, curr, ++aDepth);
			--aDepth;
		}
	}
}
