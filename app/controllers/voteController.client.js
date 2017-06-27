'use strict';

(function () {

  function getColor() {
    const HEX = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    let color = '#';
    color += HEX[Math.round(Math.random(0)*15)];
    color += HEX[Math.round(Math.random(0)*15)];
    color += HEX[Math.round(Math.random(0)*15)];
    return color;
  }

  function makeDonut(poll) {
    let name = Object.keys(poll)[0];
    let options = poll[name];
    let candidates = Object.keys(options).sort();
    const voteTotal = candidates.reduce((sum, candidate) => { return sum += +options[candidate].votes }, 0);

    let on = 0;
    let offset = 25;
    let html = '';
    let segment = '';

    html += '<figure>';
    html += `<svg width="100%" height="100%" viewBox="0 0 42 42" class="donut">`;
    html += `<circle class="donut-hole" cx="21" cy="21" r="15.92" fill="#fff" />`;
    html += `<circle class="donut-ring" cx="21" cy="21" r="15.92" fill="transparent" stroke="#d2d3d4" stroke-width="5" />`;
    if(voteTotal > 0) {
      candidates.forEach(candidate => {
        on = Math.round(options[candidate].votes / voteTotal * 100);
        segment = `${on},${100 - on}`;
        html += `<circle
          class="donut-segment"
          cx="21" cy="21" r="15.92"
          fill="transparent"
          stroke=${options[candidate].color}
          stroke-width="5"
          stroke-dasharray=${segment}
          stroke-dashoffset=${offset}
        />`;
        offset -= on;
      });
    }
    html += `</svg>`;
    return html;
  };

  var options = document.querySelectorAll('.option');

  function voteUrl(option) { return window.location.href + '/options/' + option.id; }

  ajaxFunctions.ready(() => {
    let element = document.querySelector('#donut');
    let poll = JSON.parse(element.dataset.poll);
    options.forEach(option => {
      option['color'] = getColor();
      option.updateVoteCount = function(votes) {
        votes = JSON.parse(votes);
        option.querySelector('.badge').innerHTML = votes;
        option.querySelector('.badge').style.backgroundColor = option.color;
        let name = option.parentNode.id;
        let candidate = option.id;
        let coloredCandidate = JSON.parse(`{ "votes": ${votes}, "color": "${option.color}" }`);
        poll[name][candidate] = coloredCandidate;
        element.dataset.poll = JSON.stringify(poll);
        element.innerHTML = makeDonut(poll);
      };
      ajaxFunctions.ajaxRequest('GET', voteUrl(option), option.updateVoteCount);
    })
  });

  options.forEach((option) => {
    option.addEventListener('click', function () {
      ajaxFunctions.ajaxRequest('PUT', voteUrl(option), function () {
        ajaxFunctions.ajaxRequest('GET', voteUrl(option), option.updateVoteCount);
      });
    }, false);
  });

})();
