'use strict';

const $ = require('jquery');

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  function getIssuesLinks() {
    let links = [];
    $('.ref-group-list > div').each(function() {
      links.push( $(this).find('a').attr('href') );
    });
    return links;
  }

  function getLinkDestination(link) {
    if (!link) return;

    window.open(link, '_blank');
  }

  function getIssueData() {
    const $eventDetailsContainer = $('.event-details-container');
    const $entries = $('.entries');
    const $errorDetail = $('.exception');

    if (
      $eventDetailsContainer.length === 0 ||
      $entries.length === 0 ||
      $errorDetail.length === 0
    ) {
      return;
    }

    let tagsList = {};
    $entries.find('.box-content > div > li').each(function() {
      tagsList[$(this).find('.key').text()] = $(this).find('.value > a').text();
    });

    // interface Issue {
    //   date: string // Jul 1, 2018 6:47:56 AM JST
    //   browser: string // Chrome
    //   browserVersion: string // 44.0.2403
    //   os: string // Android
    //   osVersion: string // 4.4.4
    //   device: string // Nexus 10
    //   javaScriptUrl: string // https://.....
    //   pageUrl: string // https://.....
    //   errorType: string // Error
    //   errorDetail: // Permission denied to access property Symbol.toPrimitive
    // }
    const data = {
      date: $eventDetailsContainer.find('.primary > .event-toolbar').find('time').text(),
      browser: tagsList['browser.name'],
      browserVersion: tagsList.browser,
      os: tagsList['os.name'],
      osVersion: tagsList.os,
      device: tagsList['device.family'],
      javaScriptUrl: tagsList.transaction,
      pageUrl: tagsList.url,
      errorType: $errorDetail.find('h5 > span').text(),
      errorDetail: $errorDetail.find('.exc-message').text()
    }

    let text = '';
    for (let i = 0; i < Object.keys(data).length; i++) {
      if (typeof data[Object.keys(data)[i]] !== 'undefined') {
        text += data[Object.keys(data)[i]];
      }

      if (i !== Object.keys(data).length - 1) {
        text += '	';
      }
    }
    return text;
  }

  function generateToastDom() {
    const indicatorId = `jsi-indicator-${new Date().getTime()}`;

    $('body').append(`
      <div
        id="${indicatorId}"
        style="
          z-index: 1001;
          position: fixed;
          right: 30px;
          bottom: 30px;
          padding: 6px 4px;
          background-color: #4A3F55;
          color: #FFFFFF;
        ">
        <span>Issue detail is copied to clipboard.</span>
      </div>
    `);

    setTimeout(() => {
      $(`#${indicatorId}`).remove();
    }, 2500);
  }

  $(() => {
    const links = getIssuesLinks();
    const detail = getIssueData();

    if (links.length !== 0) {
      for (let i = 0; i < links.length; i++) {
        getLinkDestination(links[i]);
      }
    } else if (detail) {
      navigator.clipboard.writeText(detail).then(() => {
        generateToastDom();
      }).catch((error) => {
        alert(`
          ERROR: export-sentry-issues-to-csv failed to copy issue detail.
          ${error}
        `);
      });
    }
  })
});
