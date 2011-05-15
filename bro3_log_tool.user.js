// ==UserScript==
// @name           bro3_log_tool
// @version        1.08
// @namespace      http://blog.livedoor.jp/froo/
// @include        http://*.3gokushi.jp/alliance/detail.php*
// @include        http://*.3gokushi.jp/alliance/alliance_log.php*
// @include        http://*.3gokushi.jp/report/detail.php*
// @include        http://*.3gokushi.jp/land.php*
// @include        http://*.3gokushi.jp/village.php*
// @include        http://*.1kibaku.jp/alliance/detail.php*
// @include        http://*.1kibaku.jp/alliance/alliance_log.php*
// @include        http://*.1kibaku.jp/report/detail.php*
// @include        http://*.1kibaku.jp/land.php*
// @include        http://*.1kibaku.jp/village.php*
// @description    ブラウザ三国志 同盟ログツール by 浮浪プログラマ
// ==/UserScript==

// 公開ページ: http://blog.livedoor.jp/froo/archives/51450661.html
// 使い方: 同盟ログ詳細(/alliance/detail.php)下部にツールリンク
// 　　　　同盟ログ一覧(/alliance/alliance_log.php)に未読マーク
// 　　　　報告書詳細(/report/detail.php)下部に戦力計算表示
// 　　　　拠点詳細(/village.php)・領地詳細(/land.php)に関連最新ログリンク

var VERSION = "1.08";
var LOCAL_STORAGE = "bro3_log_tool";

var DELIMIT = "#$%";
var DELIMIT2 = "&?@";
var DELIMIT3 = "{=]";

//データインデックス
var IDX_SUBJECT = 0; //件名
var IDX_DATE = 1; //ログ時刻
var IDX_ACTOR = 2; //攻撃者、防御者
var IDX_SOLDIER_COUNT = 3; //兵士数
//var IDX_INFORMATION = 4; //情報
var IDX2_ALLY_ID = 0; //同盟ID
var IDX2_ALLY_NAME = 1; //同盟名
var IDX2_USER_ID = 2; //ユーザID
var IDX2_USER_NAME = 3; //ユーザ名
var IDX2_VILLAGE_ID = 4; //拠点ID
var IDX2_VILLAGE_NAME = 5; //拠点名

//グローバル変数
var LOG_ID = getParameter("id");
var LOG_DATA = new Array();

//main
(function(){
	
	//mixi鯖障害回避用: 広告iframe内で呼び出されたら無視
	var container = document.evaluate('//*[@id="container"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	if (container.snapshotLength == 0) return;
	
	initGMWrapper();
	
	if (location.pathname == "/alliance/detail.php") {
		
		//ログデータ取得
		LOG_DATA[IDX_SUBJECT] = getSubject();
		LOG_DATA[IDX_DATE] = getLogDate();
		
		LOG_DATA[IDX_ACTOR] = getActor();
		LOG_DATA[IDX_SOLDIER_COUNT] = getSoldier();
//		LOG_DATA[IDX_INFORMATION] = getInformation();
		
		//HTML追加
		if (LOG_DATA[IDX_ACTOR].length > 0) {
			appendHeaderHtml();
			appendLinksHtml();
		}
		
		//保存
		saveLogData(LOG_ID, LOG_DATA);
		
	} else if (location.pathname == "/alliance/alliance_log.php") {
		checkAlreadyRead();
		
	} else if (location.pathname == "/report/detail.php") {
		appendHeaderHtml();
		appendSoldierCountHtml(getSoldier());
		
	} else if (location.pathname == "/land.php" || location.pathname == "/village.php") {
		appendNewestLogLink();
	}
})();

//件名取得
function getSubject() {
	var elem = document.evaluate(
		'//*[@id="gray02Wrapper"]/table[1]/tbody/tr[2]/td',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	
	return trim(elem.snapshotItem(0).innerHTML);
}

//ログ時刻取得
function getLogDate() {
	var elem = document.evaluate(
		'//*[@id="gray02Wrapper"]/table[@class="tables"]/tbody/tr/td[@class="sendingDate"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	
	return trim(elem.snapshotItem(0).innerHTML);
}

//攻撃者・防御者の取得
function getActor() {
	var result = new Array();
	
	var links = new Array();
	var tables = document.evaluate('//*[@id="gray02Wrapper"]/table[@class="tables"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < tables.snapshotLength; i++) {
		var itemTable = tables.snapshotItem(i);
		
		if (links[0] == undefined && itemTable.summary == "攻撃者") {
			links[0] = document.evaluate('./tbody/tr/th[@class="attackerBase"]/a',
				itemTable, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		} else if (links[1] == undefined && itemTable.summary == "防御者") {
			links[1] = document.evaluate('./tbody/tr/th[@class="defenserBase"]/a',
				itemTable, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		}
	}
	
	for (var i = 0; i < 2; i++) {
		result[i] = new Array();
		result[i][IDX2_ALLY_ID] = "";
		result[i][IDX2_ALLY_NAME] = "";
		result[i][IDX2_USER_ID] = "";
		result[i][IDX2_USER_NAME] = "";
		result[i][IDX2_VILLAGE_ID] = "";
		result[i][IDX2_VILLAGE_NAME] = "";
		
		if (links[i] == undefined) {
			//何もしない
		} else if (links[i].snapshotLength == 1) {
			result[i][IDX2_VILLAGE_ID] = getParameter2(links[i].snapshotItem(0).href, "village_id");
			result[i][IDX2_VILLAGE_NAME] = trim(links[i].snapshotItem(0).innerHTML);
		
		} else if (links[i].snapshotLength >= 3) {
			result[i][IDX2_ALLY_ID] = getParameter2(links[i].snapshotItem(0).href, "id");
			result[i][IDX2_ALLY_NAME] = trim(links[i].snapshotItem(0).innerHTML);
			result[i][IDX2_USER_ID] = getParameter2(links[i].snapshotItem(1).href, "user_id");
			result[i][IDX2_USER_NAME] = trim(links[i].snapshotItem(1).innerHTML);
			result[i][IDX2_VILLAGE_ID] = getParameter2(links[i].snapshotItem(2).href, "village_id");
			result[i][IDX2_VILLAGE_NAME] = trim(links[i].snapshotItem(2).innerHTML);
		}
		
		//防御者情報がない場合は件名欄から取得
		if (i == 1 && result[i][IDX2_VILLAGE_ID] == "") {
			var subject = getSubject();
			if (subject.match(/【不可侵条約】/)) continue;
			if (subject.match(/【同盟変更】/)) continue;
			if (subject.match(/【脱退】/)) continue;
			if (subject.match(/【同盟追放】/)) continue;
			
			var titleElem = document.evaluate(
				'//*[@id="gray02Wrapper"]/table[1]/tbody/tr[2]/td/a',
				document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
			
			if (titleElem.snapshotLength >= 2) {
				var allyIdx;
				var villageIdx;
				var attacker = getParameter2(titleElem.snapshotItem(1).href, "village_id");
				var swap = (i == 0) ? 1 : 0;
				if (result[swap][IDX2_VILLAGE_ID] == attacker) {
					if (titleElem.snapshotLength == 3) {
						villageIdx = 2;
					} else {
						allyIdx = 2;
						villageIdx = 3;
					}
				} else {
					allyIdx = 0;
					villageIdx = 1;
				}
				
				if (allyIdx == undefined) {
					result[i][IDX2_ALLY_ID] = "";
					result[i][IDX2_ALLY_NAME] = "";
				} else {
					result[i][IDX2_ALLY_ID] = 
						getParameter2(titleElem.snapshotItem(allyIdx).href, "id");
					result[i][IDX2_ALLY_NAME] = 
						trim(titleElem.snapshotItem(allyIdx).innerHTML);
				}
				result[i][IDX2_USER_ID] = "";
				result[i][IDX2_USER_NAME] = "";
				result[i][IDX2_VILLAGE_ID] = 
					getParameter2(titleElem.snapshotItem(villageIdx).href, "village_id");
				result[i][IDX2_VILLAGE_NAME] = 
					trim(titleElem.snapshotItem(villageIdx).innerHTML);
			}
		}
	}
	
	return result;
}

//兵士取得
function getSoldier() {
	var result = new Array();
	var attackerData = new Array();
	var defenderData = new Array();
	
	var tables = document.evaluate('//*[@id="gray02Wrapper"]/table[@class="tables"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < tables.snapshotLength; i++) {
		var itemTable = tables.snapshotItem(i);
		
		if (itemTable.summary == "攻撃者") {
			attackerData = addSoldierCount(attackerData, getSoldierCount(itemTable));
		} else if (itemTable.summary == "防御者") {
			defenderData = addSoldierCount(defenderData, getSoldierCount(itemTable));
		}
	}
	
	if (attackerData.length > 0 || defenderData.length > 0) {
		result.push(attackerData);
		result.push(defenderData);
	}
	
	return result;
}

//ツールHTML初期化
function resetToolHtml() {
	
	//本体部div
	var toolBody = document.getElementById("toolBody");
	if (toolBody) {
		var container = document.evaluate('//*[@id="gray02Wrapper"]',
			document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
		container.removeChild(toolBody);
	}
	
	//リンク背景色
	var linkIds = new Array("calcLink", "attackerLink", "defenderLink");
	for (var i = 0; i < linkIds.length; i++) {
		var elem = document.getElementById(linkIds[i]);
		elem.style.backgroundColor = "white";
	}
}

//ツール名＆バージョン表示HTML追加
function appendHeaderHtml() {
	var container = document.evaluate('//*[@id="gray02Wrapper"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
	
	var titleElem = document.createElement("div");
	container.appendChild(titleElem);
	titleElem.innerHTML = 
		"<br/>ログツール " + "<font size='-2'>Ver." + VERSION + "<font>";
}

//リンク部HTML追加
function appendLinksHtml() {
	var container = document.evaluate('//*[@id="gray02Wrapper"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
	
	var linkContainer = document.createElement("div");
	container.appendChild(linkContainer);
	var calcLink = document.createElement("a");
	var attackerLink = document.createElement("a");
	var defenderLink = document.createElement("a");
	linkContainer.appendChild(calcLink);
	linkContainer.appendChild(attackerLink);
	linkContainer.appendChild(defenderLink);
	
	calcLink.id = "calcLink";
	calcLink.innerHTML = "戦力計算";
	calcLink.style.margin = "4px";
	calcLink.style.padding = "2px";
	calcLink.href = "javascript:void(0)";
	calcLink.addEventListener("click", function() {dispSoldierCount()}, true);
	
	attackerLink.id = "attackerLink";
	attackerLink.innerHTML = "攻撃者関連ログ";
	attackerLink.style.margin = "4px";
	attackerLink.style.padding = "2px";
	attackerLink.href = "javascript:void(0)";
	attackerLink.addEventListener("click", function() {dispHistory(0)}, true);
	
	defenderLink.id = "defenderLink";
	defenderLink.innerHTML = "防御者関連ログ";
	defenderLink.style.margin = "4px";
	defenderLink.style.padding = "2px";
	defenderLink.href = "javascript:void(0)";
	defenderLink.addEventListener("click", function() {dispHistory(1)}, true);
}

//戦力計算表示
function dispSoldierCount() {
	resetToolHtml();
	
	var calkLink = document.getElementById("calcLink");
	calkLink.style.backgroundColor = "yellow";
	
	appendSoldierCountHtml(LOG_DATA[IDX_SOLDIER_COUNT]);
}

//関連ログ表示
//actorIdx: 0=攻撃者 1=防御者
function dispHistory(actorIdx) {
	resetToolHtml();
	
	var linkIds = new Array("attackerLink", "defenderLink");
	var link = document.getElementById(linkIds[actorIdx]);
	link.style.backgroundColor = "yellow";
	
	appendHistoryHtml(actorIdx);
}

//兵士数表示HTML追加
function appendSoldierCountHtml(soldierCount) {
	var container = document.evaluate('//*[@id="gray02Wrapper"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
	var toolBody = document.createElement("div");
	toolBody.id = "toolBody";
	container.appendChild(toolBody);
	
	//table追加
	appendRestTable(toolBody, soldierCount[0], soldierCount[1]);
	appendLossTable(toolBody, soldierCount[0], soldierCount[1]);
}

//関連ログ表示HTML追加
function appendHistoryHtml(actorIdx) {
	var container = document.evaluate('//*[@id="gray02Wrapper"]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
	var toolBody = document.createElement("div");
	toolBody.id = "toolBody";
	container.appendChild(toolBody);
	
	//table追加
	var table = document.createElement("table");
	toolBody.appendChild(table);
	table.style.fontSize = "11px";
	table.style.margin = "3px";
	
	//タイトル行
	var titleRow = document.createElement("tr");
	titleRow.style.backgroundColor = "lawngreen";
	table.appendChild(titleRow);
	var titleTexts = new Array("件名", "時刻", "攻撃戦力", "防御戦力");
	for (var i = 0; i < titleTexts.length; i++) {
		var titleField = document.createElement("th");
		titleRow.appendChild(titleField);
		titleField.style.border = "solid 1px black";
		titleField.style.padding = "3px";
		titleField.innerHTML = titleTexts[i];
	}
	
	var logs = new Array();
	if (LOG_DATA[IDX_ACTOR][actorIdx] != undefined) {
		var villageId = LOG_DATA[IDX_ACTOR][actorIdx][IDX2_VILLAGE_ID];
		logs = loadLogIndex(villageId);
		logs.sort().reverse();
	}
	
	//データ行
	for (var i = 0; i < logs.length; i++) {
		var dataRow = document.createElement("tr");
		table.appendChild(dataRow);
		if (logs[i] == LOG_ID) {
			dataRow.style.backgroundColor = "yellow";
		}
		
		var logData = loadLogData(logs[i]);
		if (logData.length == 0) continue;
		
		//件名
		var subject = "<a href='/alliance/detail.php?id=" + logs[i] + 
			"&p=" + getParameter("p") + "'>" + 
			logData[IDX_SUBJECT].replace(/<[^>]+>/g, "") + "</a>";
		
		//戦力
		var soldierTotal = new Array();
		for (var j = 0; j < 2; j++) {
			if (logData[IDX_SOLDIER_COUNT][j] == undefined) {
				soldierTotal[j] = "-";
			} else {
				soldierTotal[j] = convDispNum(totalSoldiers(logData[IDX_SOLDIER_COUNT][j][0]));
				var lossSoldier = totalSoldiers(logData[IDX_SOLDIER_COUNT][j][1]);
				if (lossSoldier != 0 && !isNaN(lossSoldier)) {
					soldierTotal[j] += "(" + convDispNum(-lossSoldier) + ")"
				}
			}
			if (villageId == logData[IDX_ACTOR][j][IDX2_VILLAGE_ID]) {
				soldierTotal[j] = "<font color='red'><b>" + soldierTotal[j] + "</b></font>";
			}
		}
		
		var dataTexts = new Array(subject, logData[IDX_DATE], soldierTotal[0], soldierTotal[1]);
		for (var j = 0; j < dataTexts.length; j++) {
			var field = document.createElement("td");
			field.style.border = "solid 1px black";
			field.style.padding = "3px";
			dataRow.appendChild(field);
			field.innerHTML = dataTexts[j];
		}
	}
}

//兵士数加算
function addSoldierCount(total, add) {
	if (total == undefined) total = new Array();
	for (var i = 0; i < 2; i++) {
		if (total[i] == undefined) {
			total[i] = new Array(0,0,0,0,0,0,0,0,0,0,0);
		}
		for (var j = 0; j < 11; j++) {
			total[i][j] += add[i][j];
		}
	}
	
	return total;
}

//兵士数取得
function getSoldierCount(table) {
	var result = new Array();
	
	var rows = document.evaluate('./tbody/tr',
		table, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < rows.snapshotLength; i++) {
		var row = rows.snapshotItem(i);
		
		var fields = document.evaluate('./td',
			row, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
		if (fields.snapshotLength != 12) continue;
		var temp = new Array();
		for (var j = 0; j < fields.snapshotLength; j++) {
			var field = fields.snapshotItem(j);
			temp[j] = parseInt(trim(field.innerHTML));
		}
		
		result.push(temp);
	}
	
	return result;
}

//残兵士table追加
function appendRestTable(container, atData, dfData) {
	var table = document.createElement("table");
	container.appendChild(table);
	table.id = "restSoldier";
	table.className = "tables";
	
	table.innerHTML = 
		'<tr>'+
			'<th class="attacker" style="background-color:lawngreen;">残兵士合計</th>'+
			'<th class="attackerBase" style="background-color:lawngreen;" colspan="13"></th>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank"> </th>'+
			'<th class="solClass">剣兵</th>'+
			'<th class="solClass">槍兵</th>'+
			'<th class="solClass">弓兵</th>'+
			'<th class="solClass">騎兵</th>'+
			'<th class="solClass">矛槍兵</th>'+
			'<th class="solClass">弩兵</th>'+
			'<th class="solClass">近衛騎兵</th>'+
			'<th class="solClass">斥候</th>'+
			'<th class="solClass">斥候騎兵</th>'+
			'<th class="solClass">衝車</th>'+
			'<th class="solClass">投石機</th>'+
			'<th class="solClass">合計</th>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank">攻撃者</th>'+
			'<td id="restAttacker0"></td>'+
			'<td id="restAttacker1"></td>'+
			'<td id="restAttacker2"></td>'+
			'<td id="restAttacker3"></td>'+
			'<td id="restAttacker4"></td>'+
			'<td id="restAttacker5"></td>'+
			'<td id="restAttacker6"></td>'+
			'<td id="restAttacker7"></td>'+
			'<td id="restAttacker8"></td>'+
			'<td id="restAttacker9"></td>'+
			'<td id="restAttacker10"></td>'+
			'<td id="restAttackerTotal"></td>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank">防御者</th>'+
			'<td id="restDefender0"></td>'+
			'<td id="restDefender1"></td>'+
			'<td id="restDefender2"></td>'+
			'<td id="restDefender3"></td>'+
			'<td id="restDefender4"></td>'+
			'<td id="restDefender5"></td>'+
			'<td id="restDefender6"></td>'+
			'<td id="restDefender7"></td>'+
			'<td id="restDefender8"></td>'+
			'<td id="restDefender9"></td>'+
			'<td id="restDefender10"></td>'+
			'<td id="restDefenderTotal"></td>'+
		'</tr>';
	
	//各項目設定
	var rowKey = new Array("restAttacker", "restDefender");
	var allData = new Array(atData, dfData);
	for (var i = 0; i < rowKey.length; i++) {
		if (allData[i] == undefined) break;
		var restArray = new Array();
		
		for (var col = 0; col < 11; col++) {
			if (allData[i][0] == undefined || allData[i][1] == undefined) {
				restArray[col] = NaN;
			} else {
				restArray[col] = allData[i][0][col] - allData[i][1][col];
			}
			var field = document.getElementById(rowKey[i] + col);
			field.innerHTML = convDispNum(restArray[col]);
		}
		
		var totalField = document.getElementById(rowKey[i] + "Total");
		totalField.innerHTML = convDispNum(totalSoldiers(restArray));
	}
}

//死傷者table追加
function appendLossTable(container, atData, dfData) {
	var table = document.createElement("table");
	container.appendChild(table);
	table.id = "lossSoldier";
	table.className = "tables";
	
	table.innerHTML = 
		'<tr>'+
			'<th class="attacker" style="background-color:lawngreen;">死傷者合計</th>'+
			'<th class="attackerBase" style="background-color:lawngreen;" colspan="13"></th>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank"> </th>'+
			'<th class="solClass">剣兵</th>'+
			'<th class="solClass">槍兵</th>'+
			'<th class="solClass">弓兵</th>'+
			'<th class="solClass">騎兵</th>'+
			'<th class="solClass">矛槍兵</th>'+
			'<th class="solClass">弩兵</th>'+
			'<th class="solClass">近衛騎兵</th>'+
			'<th class="solClass">斥候</th>'+
			'<th class="solClass">斥候騎兵</th>'+
			'<th class="solClass">衝車</th>'+
			'<th class="solClass">投石機</th>'+
			'<th class="solClass">合計</th>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank">攻撃者</th>'+
			'<td id="lossAttacker0"></td>'+
			'<td id="lossAttacker1"></td>'+
			'<td id="lossAttacker2"></td>'+
			'<td id="lossAttacker3"></td>'+
			'<td id="lossAttacker4"></td>'+
			'<td id="lossAttacker5"></td>'+
			'<td id="lossAttacker6"></td>'+
			'<td id="lossAttacker7"></td>'+
			'<td id="lossAttacker8"></td>'+
			'<td id="lossAttacker9"></td>'+
			'<td id="lossAttacker10"></td>'+
			'<td id="lossAttackerTotal"></td>'+
		'</tr>'+
		'<tr>'+
			'<th class="blank">防御者</th>'+
			'<td id="lossDefender0"></td>'+
			'<td id="lossDefender1"></td>'+
			'<td id="lossDefender2"></td>'+
			'<td id="lossDefender3"></td>'+
			'<td id="lossDefender4"></td>'+
			'<td id="lossDefender5"></td>'+
			'<td id="lossDefender6"></td>'+
			'<td id="lossDefender7"></td>'+
			'<td id="lossDefender8"></td>'+
			'<td id="lossDefender9"></td>'+
			'<td id="lossDefender10"></td>'+
			'<td id="lossDefenderTotal"></td>'+
		'</tr>';
	
	//各項目設定
	var rowKey = new Array("lossAttacker", "lossDefender");
	var allData = new Array(atData, dfData);
	for (var i = 0; i < rowKey.length; i++) {
		if (allData[i] == undefined) break;
		
		var lossArray;
		if (allData[i][1] == undefined) {
			lossArray = new Array();
		} else {
			lossArray = allData[i][1];
		}
		
		for (var col = 0; col < 11; col++) {
			var field = document.getElementById(rowKey[i] + col);
			field.innerHTML = convDispNum(lossArray[col]);
		}
		
		var totalField = document.getElementById(rowKey[i] + "Total");
		totalField.innerHTML = convDispNum(totalSoldiers(lossArray));
	}
}

//兵士合計（ポイント換算）
function totalSoldiers(soldiers) {
	if (soldiers == undefined || soldiers.length == 0) return NaN;
	var result = 0;
	
	//剣兵
	result += soldiers[0];
	
	//下級兵
	for (var i = 1; i <= 3; i++) {
		result += soldiers[i] * 2;
	}
	
	//上級兵
	for (var i = 4; i <= 6; i++) {
		result += soldiers[i] * 4;
	}
	
	//斥候
	result += soldiers[7];
	result += soldiers[8] * 2;
	
	//攻城兵器
	result += soldiers[9] * 2;
	result += soldiers[10] * 4;
	
	return result;
}

//ログデータ永続保存
function saveLogData(logId, logData) {
	var logDataStr = new Array();
	logDataStr[IDX_SUBJECT] = logData[IDX_SUBJECT]; //件名
	logDataStr[IDX_DATE] = logData[IDX_DATE]; //ログ時刻
	
	//攻撃者・防御者
	logDataStr[IDX_ACTOR] = new Array();
	if (logData[IDX_ACTOR].length > 0) {
		logDataStr[IDX_ACTOR][0] = 
			genDelimitString(logData[IDX_ACTOR][0], DELIMIT3); //攻撃者
		logDataStr[IDX_ACTOR][1] = 
			genDelimitString(logData[IDX_ACTOR][1], DELIMIT3); //防御者
	}
	logDataStr[IDX_ACTOR] = 
		genDelimitString(logDataStr[IDX_ACTOR], DELIMIT2);
	
	//兵士数
	logDataStr[IDX_SOLDIER_COUNT] = new Array();
	for (var i = 0; i < logData[IDX_SOLDIER_COUNT].length; i++) {
		logDataStr[IDX_SOLDIER_COUNT][i] = new Array();
		if (logData[IDX_SOLDIER_COUNT][i] == undefined) continue;
		for (var j = 0; j < logData[IDX_SOLDIER_COUNT][i].length; j++) {
			logDataStr[IDX_SOLDIER_COUNT][i][j] = new Array();
			for (var k = 0; k < logData[IDX_SOLDIER_COUNT][i][j].length ; k++) {
				logDataStr[IDX_SOLDIER_COUNT][i][j][k] = 
					convDispNum(logData[IDX_SOLDIER_COUNT][i][j][k]);
			}
		}
		logDataStr[IDX_SOLDIER_COUNT][i] = 
			genDelimitString(logDataStr[IDX_SOLDIER_COUNT][i], DELIMIT3);
	}
	logDataStr[IDX_SOLDIER_COUNT] = 
		genDelimitString(logDataStr[IDX_SOLDIER_COUNT], DELIMIT2);
	
	//ログデータ本体をGreasemonkey領域へ永続保存
	GM_setValue(generateLogKey(logId), genDelimitString(logDataStr, DELIMIT))
//console.log(generateLogKey(logId)+": " + genDelimitString(logDataStr, DELIMIT));
	
	//ログインデックスに追加
	addIndex(location.hostname + "_log_index", logId, ",");
	
	//拠点インデックスに追加
	if (logData[IDX_ACTOR].length > 0) {
		var nameUpdate = false;
		var names = splitDelimited(
			GM_getValue(location.hostname + "_village_name", ""), DELIMIT);
		
		for (var i = 0; i < logData[IDX_ACTOR].length; i++) {
			var actorId = logData[IDX_ACTOR][i][IDX2_VILLAGE_ID];
			var actorName = logData[IDX_ACTOR][i][IDX2_VILLAGE_NAME];
			
			//拠点ID-ログIDインデックスに追加
			addIndex(generateVillageKey(actorId), logId, ",");
			
			//拠点ID-拠点名インデックスに追加
			if (actorName != "") {
				var nameExists = false;
				for (var j = 0; j < names.length; j++) {
					var item = splitDelimited(names[j], DELIMIT2);
					if (item[0] == actorId) {
						if (item[1] == actorName) {
							nameExists = true;
						}
						break;
					}
				}
				if (!nameExists) {
					nameUpdate = true;
					names[j] = actorId + DELIMIT2 + actorName;
				}
			}
		}
		
		//拠点名-拠点IDインデックスをGreasemonkey領域へ永続保存
		if (nameUpdate) {
			GM_setValue(location.hostname + "_village_name", genDelimitString(names, DELIMIT));
//console.log(location.hostname + "_village_name"+": " + genDelimitString(names, DELIMIT));
		}
	}
}

//インデックス追加
function addIndex(key, value, delimiter) {
	var items = splitDelimited(GM_getValue(key, ""), delimiter);
	
	if (items.indexOf(value) == -1) {
		items.push(value);
		
		//Greasemonkey領域へ永続保存
		GM_setValue(key, genDelimitString(items, delimiter));
//console.log(key+": " + genDelimitString(items, delimiter));
	}
}

//ログデータ読み出し
function loadLogData(logId) {
	var result = splitDelimited(GM_getValue(generateLogKey(logId), ""), DELIMIT);
	if (result.length == 0) return result;
	
	//攻撃者・防御者
	result[IDX_ACTOR] = splitDelimited(result[IDX_ACTOR], DELIMIT2);
	for (var i = 0; i < result[IDX_ACTOR].length; i++) {
		result[IDX_ACTOR][i] = splitDelimited(result[IDX_ACTOR][i], DELIMIT3);
	}
	
	//兵士数
	result[IDX_SOLDIER_COUNT] = splitDelimited(result[IDX_SOLDIER_COUNT], DELIMIT2);
	for (var i = 0; i < result[IDX_SOLDIER_COUNT].length; i++) {
		result[IDX_SOLDIER_COUNT][i] = 
			splitDelimited(result[IDX_SOLDIER_COUNT][i], DELIMIT3);
		for (var j = 0; j < result[IDX_SOLDIER_COUNT][i].length; j++) {
			result[IDX_SOLDIER_COUNT][i][j] = 
				splitDelimited(result[IDX_SOLDIER_COUNT][i][j], ",");
			for (var k = 0; k < result[IDX_SOLDIER_COUNT][i][j].length; k++) {
				result[IDX_SOLDIER_COUNT][i][j][k] = 
					parseInt(result[IDX_SOLDIER_COUNT][i][j][k]);
			}
		}
	}
	
	return result;
}

//未読チェック
function checkAlreadyRead() {
	var logs = splitDelimited(GM_getValue(location.hostname + "_log_index", ""), ",");
	
	var rowElems = document.evaluate(
		'//*[@id="gray02Wrapper"]/div/div/table/tbody/tr/td[1]',
		document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for (var i = 0; i < rowElems.snapshotLength; i++) {
		var field = rowElems.snapshotItem(i);
		var link = document.evaluate('./a', field, null, 
			XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
		var id = getParameter2(link.href, "id");
		if (logs.indexOf(id) == -1) {
			field.innerHTML += " [未]";
		}
	}
}

//拠点に関係する最新ログへのリンクを追加
function appendNewestLogLink() {
	
	//拠点名を取得
	var baseNameElem = document.evaluate(
		'//*[@id="basepoint"]/span[@class="basename"]',
		document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
	var baseName = trim(baseNameElem.snapshotItem(0).innerHTML);
	
	//拠点ID取得
	var villageId = "";
	var names = splitDelimited(
		GM_getValue(location.hostname + "_village_name", ""), DELIMIT);
	for (var j = 0; j < names.length; j++) {
		var item = splitDelimited(names[j], DELIMIT2);
		if (item[1] == baseName) {
			villageId = item[0];
			break;
		}
	}
	
	//最新ログのID取得
	var logId = "";
	var names = new Array();
	if (villageId != "") {
		var logs = loadLogIndex(villageId);
		if (logs.length > 0) {
			logs.sort().reverse();
			logId = "" + logs[0];
		}
	}
	
	//リンクHTML追加
	if (logId != "") {
		var statusElem = document.evaluate('//*[@id="basepoint"]/div[@class="status"] | ' +
			'//*[@id="basepoint"]/div[@class="status village-bottom"]',
			document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotItem(0);
		
		var sepElem = document.createElement("span");
		statusElem.appendChild(sepElem);
		sepElem.className = "sep";
		sepElem.style.margin = "4px";
		sepElem.innerHTML = "|";
		
		var linkElem = document.createElement("a");
		statusElem.appendChild(linkElem);
		linkElem.href = "/alliance/detail.php?id=" + logId;
		linkElem.style.margin = "4px";
		linkElem.innerHTML = "最新ログ";
	}
}

//ログインデックス取得
function loadLogIndex(villageId) {
	var logs = splitDelimited(GM_getValue(generateVillageKey(villageId), ""), ",");
	for (var i = 0; i < logs.length; i++) logs[i] = parseInt(logs[i]);
	return logs;
}


//ログデータキー生成
function generateLogKey(logId) {
	return location.hostname + "_log_" + logId;
}
//拠点データキー生成
function generateVillageKey(villageId) {
	return location.hostname + "_village_" + villageId;
}
//君主データキー生成
//function generateUserKey(userName) {
//	return location.hostname + "_user_" + escape(userName);
//}

//数値を表示用に変換
function convDispNum(value) {
	if (isNaN(value)) {
		return "?";
	} else {
		return "" + value;
	}
}

//URLパラメータ取得
function getParameter(key) {
	return getParameter2(location.search, key);
}

//URLパラメータ取得
function getParameter2(url, key) {
	var str = url.replace(/#.*$/, "").split("?");
	if (str.length < 2) {
		return "";
	}
	
	var params = str[1].split("&");
	for (var i = 0; i < params.length; i++) {
		var keyVal = params[i].split("=");
		if (keyVal[0] == key && keyVal.length == 2) {
			return decodeURIComponent(keyVal[1]);
		}
	}
	return "";
}

//デリミタ区切り文字列生成
function genDelimitString(dataArray, delimiter) {
	var ret = "";
	if (dataArray == undefined) return ret;
	
	for (var i=0; i < dataArray.length; i++) {
		if (dataArray[i] != undefined) ret += dataArray[i];
		if (i < dataArray.length-1) ret += delimiter;
	}
	return ret;
}

//デリミタ区切り文字列を配列に変換
function splitDelimited(str, delimiter) {
	if (str == undefined || str == "") {
		return new Array();
	} else {
		return str.split(delimiter);
	}
}

//空白除去
function trim(str) {
	return str.replace(/^[ 　\t\r\n]+|[ 　\t\r\n]+$/g, "");
}

//Google Chrome用GM_*系ラッパー関数
function initGMWrapper() {
	
	// @copyright      2009, James Campos
	// @license        cc-by-3.0; http://creativecommons.org/licenses/by/3.0/
	if ((typeof GM_getValue == 'undefined') || (GM_getValue('a', 'b') == undefined)) {
		GM_addStyle = function(css) {
			var style = document.createElement('style');
			style.textContent = css;
			document.getElementsByTagName('head')[0].appendChild(style);
		}

		GM_deleteValue = function(name) {
			localStorage.removeItem(LOCAL_STORAGE + "." + name);
		}

		GM_getValue = function(name, defaultValue) {
			var value = localStorage.getItem(LOCAL_STORAGE + "." + name);
			if (!value)
				return defaultValue;
			var type = value[0];
			value = value.substring(1);
			switch (type) {
				case 'b':
					return value == 'true';
				case 'n':
					return Number(value);
				default:
					return value;
			}
		}

		GM_log = function(message) {
			console.log(message);
		}

		GM_registerMenuCommand = function(name, funk) {
		//todo
		}

		GM_setValue = function(name, value) {
			value = (typeof value)[0] + value;
			try {
				localStorage.setItem(LOCAL_STORAGE + "." + name, value);
			} catch (e) {
				alert("localStorageへの保存に失敗 (" + e + ")");
				throw e;
			}
		}
	}
}
