/* ==========================================================================
   MAG Transportation Study — Scripts (jQuery 1.11.x + Bootstrap 3.2.0)
   ========================================================================== */
(function ($) {
  'use strict';

  var supportsReducedMotion = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false;

  $(function () {

    /* -------------------------------------------
       0) Header navigation toggle (mobile)
       ------------------------------------------- */
    var $navToggle = $('#magNavToggle');
    var $nav = $('#magPrimaryNav');
    if ($navToggle.length && $nav.length) {
      var desktopMq = window.matchMedia('(min-width: 768px)');

      function syncNavState() {
        var isDesktop = desktopMq.matches;
        var isExpanded = $navToggle.attr('aria-expanded') === 'true';
        if (isDesktop) {
          $nav.removeClass('mag-header__nav--open');
          $nav.attr('aria-hidden', 'false');
          $navToggle.attr('aria-expanded', 'false').removeClass('mag-header__toggle--open');
        } else {
          $nav.toggleClass('mag-header__nav--open', isExpanded);
          $nav.attr('aria-hidden', isExpanded ? 'false' : 'true');
        }
      }

      $navToggle.on('click', function () {
        var isExpanded = $(this).attr('aria-expanded') === 'true';
        var nextState = !isExpanded;
        $(this).attr('aria-expanded', nextState)
          .toggleClass('mag-header__toggle--open', nextState);
        $nav.toggleClass('mag-header__nav--open', nextState)
            .attr('aria-hidden', nextState ? 'false' : 'true');

        if (!nextState) {
          $(this).focus();
        }
      });

      $nav.on('click', '.mag-header__nav-link', function () {
        if (!desktopMq.matches) {
          $navToggle.attr('aria-expanded', 'false')
            .removeClass('mag-header__toggle--open');
          $nav.removeClass('mag-header__nav--open')
              .attr('aria-hidden', 'true');
        }
      });

      $(document).on('keydown', function (evt) {
        if (evt.key === 'Escape' && $navToggle.attr('aria-expanded') === 'true') {
          $navToggle.trigger('click');
        }
      });

      if (typeof desktopMq.addEventListener === 'function') {
        desktopMq.addEventListener('change', syncNavState);
      } else if (typeof desktopMq.addListener === 'function') {
        desktopMq.addListener(syncNavState);
      }

      syncNavState();
    }

    /* -------------------------------------------
       1) Site search reveal (aria-friendly)
       ------------------------------------------- */
    // Focus search field when the modal opens
    $('#siteSearchModal').on('shown.bs.modal', function () {
    $(this).find('input[type="search"]').focus();
    });

    // Optional: basic submit handling (demo only)
    $(document).on('submit', '#site-search', function (e) {
    e.preventDefault();
    var term = $.trim($('#q').val());
    var $status = $(this).find('.mag-form__status');
    if (!term) {
        $status.text('Please enter a search term.').css('color', '#b91c1c');
        return;
    }
    // Demo behavior: confirm and close modal
    $status.text('Searching for “' + term + '”…').css('color', '#18345D');
    setTimeout(function(){
        $('#siteSearchModal').modal('hide');
    }, 400);
    });

    /* -------------------------------------------
       2) Smooth anchor scroll (respect reduced motion)
          - skip empty/hash-only and Bootstrap targets
       ------------------------------------------- */
    $('a[href^="#"]').not('[href="#"]').not('[data-toggle]').on('click', function (e) {
      var id = this.getAttribute('href');
      var $target = $(id);
      if ($target.length) {
        e.preventDefault();
        if (supportsReducedMotion) {
          window.location.hash = id;
          $target.attr('tabindex', '-1').focus();
        } else {
          $('html, body').animate({ scrollTop: $target.offset().top - 16 }, 350, function () {
            $target.attr('tabindex', '-1').focus();
          });
        }
      }
    });

    /* -------------------------------------------
       3) Forms: simple required validation + status
       ------------------------------------------- */
    function wireForm($forms) {
      if (!$forms.length) { return; }
      $forms.each(function () {
        var $form = $(this);
        $form.on('submit', function (e) {
          e.preventDefault();
          var valid = true;
          $form.find('[required]').each(function () {
            var $field = $(this);
            var fieldValid = true;
            if (typeof this.checkValidity === 'function') {
              fieldValid = this.checkValidity();
            } else {
              fieldValid = $.trim($field.val()).length > 0;
            }
            if (!fieldValid) {
              valid = false;
              $field.attr('aria-invalid', 'true').closest('.form-group').addClass('has-error');
            } else {
              $field.removeAttr('aria-invalid').closest('.form-group').removeClass('has-error');
            }
          });

          var $status = $form.find('.mag-form__status');
          if ($status.length) {
            if (!valid) {
              $status.text('Please complete all required fields.').css('color', '#b91c1c');
            } else {
              $status.text('Thanks! Your submission has been received.').css('color', '#166534');
              $form[0].reset();
            }
          }
        });

        $form.find('input, textarea, select').on('input change', function () {
          $(this).removeAttr('aria-invalid').closest('.form-group').removeClass('has-error');
        });
      });
    }
    wireForm($('.mag-form'));

    /* -------------------------------------------
       4) Modal focus return to trigger
       ------------------------------------------- */
    var $lastTrigger = null;
    $(document).on('click', '[data-toggle="modal"]', function () { $lastTrigger = $(this); });
    $('#mapModal').on('shown.bs.modal', function () {
      $(this).find('.close').focus();
    }).on('hidden.bs.modal', function () {
      if ($lastTrigger && $lastTrigger.length) { $lastTrigger.focus(); }
    });

    /* -------------------------------------------
       5) Chart.js (bonus) — toggle between datasets
          Requires Chart.js 2.9.4 loaded before this file.
       ------------------------------------------- */
    if (window.Chart && $('#magChart').length) {
      var ctx = document.getElementById('magChart').getContext('2d');
      var $summary = $('#magChartSummary');
      var chartInstance = null;

      var datasets = {
        air: {
          type: 'doughnut',
          data: {
            labels: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy'],
            datasets: [{
              data: [210, 120, 25, 8, 2],
              backgroundColor: ['#6EBE19', '#00B3E4', '#FFC107', '#D82E19', '#18345D']
            }]
          },
          options: {
            responsive: true,
            legend: { position: 'bottom', labels: { boxWidth: 14 } },
            cutoutPercentage: 60,
            animation: supportsReducedMotion ? { duration: 0 } : {}
          },
          summary: 'In 2024, Maricopa County had 210 good air quality days and 120 moderate days; fewer than 5% of days were unhealthy.'
        },

        vmt: {
          type: 'line',
          data: {
            labels: ['2015','2016','2017','2018','2019','2020','2021','2022','2023'],
            datasets: [{
              label: 'Millions of Miles',
              data: [54800, 55200, 57100, 58900, 60200, 52400, 56700, 59100, 60800],
              fill: false,
              borderColor: '#18345D',
              pointBackgroundColor: '#6EBE19',
              pointRadius: 3,
              lineTension: 0.15
            }]
          },
          options: {
            responsive: true,
            legend: { display: false },
            scales: {
              yAxes: [{ ticks: { beginAtZero: false } }],
              xAxes: [{ gridLines: { display: false } }]
            },
            animation: supportsReducedMotion ? { duration: 0 } : {}
          },
          summary: 'Regional Vehicle Miles Traveled (VMT) rose 2015–2019, dipped in 2020, and recovered through 2023 to ~60.8B miles.'
        },

        energy: {
          type: 'bar',
          data: {
            labels: ['2018','2019','2020','2021','2022','2023'],
            datasets: [
              { label: 'Renewable (%)',   data: [18,25,25,21,32,35], backgroundColor: '#6EBE19' },
              { label: 'Natural Gas (%)', data: [46,44,41,39,36,35], backgroundColor: '#00B3E4' },
              { label: 'Coal (%)',        data: [25,24,23,22,20,18], backgroundColor: '#D82E19' },
              { label: 'Nuclear (%)',     data: [11,11,11,11,12,12], backgroundColor: '#18345D' }
            ]
          },
          options: {
            responsive: true,
            legend: { position: 'bottom' },
            scales: {
              xAxes: [{ stacked: true }],
              yAxes: [{ stacked: true, ticks: { beginAtZero: true, max: 100 } }]
            },
            animation: supportsReducedMotion ? { duration: 0 } : {}
          },
          summary: 'Energy mix is shifting cleaner: renewables grew from 18% (2018) to 35% (2023) as coal declined.'
        }
      };

      function renderChart(kind) {
        var cfg = datasets[kind] || datasets.air;
        if (chartInstance) { chartInstance.destroy(); }
        chartInstance = new Chart(ctx, { type: cfg.type, data: cfg.data, options: cfg.options });
        if ($summary.length) { $summary.text(cfg.summary); }
      }

      renderChart('air');

      $(document).on('click', '.mag-chart-btn', function () {
        var kind = $(this).data('chart');
        $('.mag-chart-btn').removeClass('active').attr('aria-pressed', 'false');
        $(this).addClass('active').attr('aria-pressed', 'true');
        renderChart(kind);
      });
    } else {
      /* -------------------------------------------
         6) Fallback: JS disabled or Chart.js missing
         ------------------------------------------- */
      var $chartContainer = $('#statistics .container');
      if ($chartContainer.length && !$chartContainer.find('.mag-chart-fallback').length) {
        var fallbackHtml = '' +
          '<div class="mag-chart-fallback" role="group" aria-label="Key study statistics summary">' +
          '<p><strong>Interactive charts are unavailable at the moment.</strong></p>' +
          '<p>You can still review highlights from the dataset:</p>' +
          '<ul>' +
          '<li><strong>Air Quality Days (2024):</strong> 210 Good, 120 Moderate, 35 Unhealthy or worse.</li>' +
          '<li><strong>Vehicle Miles Traveled (2023):</strong> 60.8 billion miles.</li>' +
          '<li><strong>Energy Mix (2023):</strong> 35% Renewable, 35% Natural Gas, 18% Coal, 12% Nuclear.</li>' +
          '</ul>' +
          '</div>';
        $chartContainer.append(fallbackHtml);
      }
    }

  });

})(jQuery);
