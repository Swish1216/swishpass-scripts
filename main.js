// ========================================
// GLOBAL AUTH GUARD — runs on every page
// ========================================
const PUBLIC_PATHS = [
  "/",           // ← ADD THIS
  "/sign-in",
  "/sign-up",
  "/confirm-email",
  "/username-setup",
  "/profile-setup",
  "/forgot-password",
  "/change-password",
  "/home",
  "/features",
  "/pricing",
  "/terms-and-conditions",
  "/privacy-policy",
  "/faq",
  "/contact-us",
  "/coming-soon"
];

// ── Supabase email confirmation redirect ──────────────────────────────────
// Supabase sends confirmation links to the root domain with the token in the
// hash. Detect it here and forward to /sign-in so the banner can display.
(function() {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    var hash = window.location.hash;
    var path = window.location.pathname;
    // Only intercept on pages that aren't /sign-in already
    if (!path.includes('/sign-in') && !path.includes('/change-password')) {
      window.location.replace('/sign-in' + hash);
    }
  }
})();

(function () {
  const path = window.location.pathname;
  const isPublic = PUBLIC_PATHS.some(function (p) { return path.includes(p); });

  if (isPublic) {
    // Public page — still run page init on DOMContentLoaded
    document.addEventListener("DOMContentLoaded", function () {
      if (path.includes("/sign-in")) initLogin();
      else if (path.includes("/username-setup")) initUsernameSetup();
      else if (path.includes("/change-username")) initChangeUsername();
      else if (path.includes("/profile-setup")) initProfileSetup();
      else if (path.includes("/change-password")) initChangePassword();
      else if (path.includes("/forgot-password")) initForgotPassword();
      if (window.location.pathname === '/groups') initCreateGroup();
      if (window.location.pathname === '/group-profiles') loadGroupProfile();
      
      const signOutBtn = document.getElementById('sign-out-btn');
      if (signOutBtn) signOutBtn.addEventListener('click', signOut);
    });
    return;
  }

  // Protected page — wait for Supabase to confirm auth state
  var authTimeout = setTimeout(function () {
    window.location.href = "/sign-in";
  }, 3000);

var authListener = window._supabase.auth.onAuthStateChange(function (event, session) {
  if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (!session) {
      clearTimeout(authTimeout);
      window.location.href = "/sign-in";
      return;
    }

    updateHeaderAuthUI(session);  // ← NEW LINE ADDED HERE

      // Gate unconfirmed users
      if (!session.user.email_confirmed_at) {
        clearTimeout(authTimeout);
        window.location.href = '/confirm-email';
        return;
      }

      // Check onboarding state
      window._supabase
        .from("Players")
        .select("Username, Position")
        .eq("auth_user_id", session.user.id)
        .single()
        .then(function (result) {
          clearTimeout(authTimeout);
          var player = result.data;

          if (!player || !player.Username) {
            window.location.href = "/username-setup";
            return;
          }
          if (!player.Position) {
            window.location.href = "/profile-setup";
            return;
          }

          // All good — run page init
          document.addEventListener("DOMContentLoaded", function () {
            if (path.includes("/sign-in")) initLogin();
            else if (path.includes("/username-setup")) initUsernameSetup();
            else if (path.includes("/change-username")) initChangeUsername();
            else if (path.includes("/profile-setup")) initProfileSetup();
            else if (path.includes("/change-password")) initChangePassword();
            else if (path.includes("/forgot-password")) initForgotPassword();
            if (window.location.pathname === '/groups') initCreateGroup();
            if (window.location.pathname === '/group-profiles') loadGroupProfile();
            
            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) signOutBtn.addEventListener('click', signOut);

if (document.readyState === 'complete') {
  autofillUser();
} else {
  window.addEventListener('load', autofillUser);
}
          });

          // If DOMContentLoaded already fired, run immediately
          if (document.readyState === 'interactive' || document.readyState === 'complete') {
            if (path.includes("/sign-in")) initLogin();
            else if (path.includes("/username-setup")) initUsernameSetup();
            else if (path.includes("/change-username")) initChangeUsername();
            else if (path.includes("/profile-setup")) initProfileSetup();
            else if (path.includes("/change-password")) initChangePassword();
            else if (path.includes("/forgot-password")) initForgotPassword();
            if (window.location.pathname === '/groups') initCreateGroup();
            if (window.location.pathname === '/group-profiles') loadGroupProfile();

            const signOutBtn = document.getElementById('sign-out-btn');
            if (signOutBtn) signOutBtn.addEventListener('click', signOut);

if (document.readyState === 'complete') {
  autofillUser();
} else {
  window.addEventListener('load', autofillUser);
}
          }
        });

} else if (event === 'SIGNED_OUT') {
      clearTimeout(authTimeout);
      updateHeaderAuthUI(null);  // ← ADD THIS LINE
      window.location.href = "/sign-in";
    }
  });
})();

// ========================================
// SHARED SUPABASE AUTH HELPER
// Replaces all window.$memberstackDom blocks
// ========================================
async function getCurrentPlayer() {
  const { data: { session } } = await window._supabase.auth.getSession();
  if (!session) return { email: null, playerId: null };

  const { data } = await window._supabase
    .from("Players")
    .select('player_id, "Email"')
    .eq("auth_user_id", session.user.id)
    .limit(1);

  if (data && data.length > 0) {
    return { email: data[0].Email, playerId: data[0].player_id };
  }
  return { email: session.user.email, playerId: null };
}

// ========================================
// GLOBAL AUTOFILL
// Populates any element with data-user="username" or data-user="email"
// ========================================
async function autofillUser() {
  if (!window._supabase) return;

  const { data: { session } } = await window._supabase.auth.getSession();
  if (!session) return;

  const { data: player } = await window._supabase
    .from("Players")
    .select('"Username", "Email", "Tier", "XP", "Position", "Top Skill", "Favorite Player", "Profile Photo URL", "State/Province", "Country", "Ranking", "MVP Count", "player_id", "Created"')
    .eq("auth_user_id", session.user.id)
    .single();

  if (!player) return;

  // Format the Created timestamp to MM/DD/YYYY
  const createdFormatted = player.Created
    ? new Date(player.Created).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      })
    : "";

  const fields = {
    "username":        player.Username,
    "email":           player.Email,
    "tier":            player.Tier,
    "xp":              player.XP,
    "position":        player.Position,
    "top-skill":       player["Top Skill"],
    "favorite-player": player["Favorite Player"],
    "state":           player["State/Province"],
    "country":         player.Country,
    "ranking":         player.Ranking,
    "mvp-count":       player["MVP Count"],
    "player-id":       player.player_id,
    "created":         createdFormatted,
  };

  Object.entries(fields).forEach(([key, value]) => {
    document.querySelectorAll(`[data-user="${key}"]`).forEach(el => {
      el.textContent = value ?? "";
    });
  });

  // Sidebar username
updateSidebarUI(player);

  if (player["Profile Photo URL"]) {
    document.querySelectorAll('[data-user="photo"]').forEach(el => {
      el.src = player["Profile Photo URL"];
    });
  }
}


// ========================================
// GLOBAL LEADERBOARD
// ========================================
window.addEventListener('load', function() {
  if (document.getElementById('leaderboard-container')) {
    window.loadLeaderboard();
  }
});

window.loadLeaderboard = async function() {
  var container = document.getElementById('leaderboard-container');
  if (!container) return;
  var search = document.getElementById('lb-search') ? document.getElementById('lb-search').value.toLowerCase() : '';
  var country = document.getElementById('lb-country') ? document.getElementById('lb-country').value : '';
  var state = document.getElementById('lb-state') ? document.getElementById('lb-state').value : '';
var result = await window._supabase
    .from('Players')
    .select('"Username", "Tier", "XP", "State/Province", "Country"')
    .eq('status', 'active')
    .order('"XP"', { ascending: false });
  var data = result.data;
  var error = result.error;
  if (error) { console.error(error); return; }
  if (search) {
    data = data.filter(function(p) {
      return p.Username && p.Username.toLowerCase().includes(search);
    });
  }
  if (country) {
    data = data.filter(function(p) { return p.Country === country; });
  }
  if (state) {
    data = data.filter(function(p) { return p['State/Province'] === state; });
  }
  var allResult = await window._supabase
    .from('Players')
    .select('"Country", "State/Province"');
  var allData = allResult.data || [];
var countries = [...new Set(allData.map(function(p) { return p.Country; }).filter(function(c) {
  return c && c !== 'N/A' && c.trim() !== '';
}))].sort();
var states = [...new Set(allData.map(function(p) { return p['State/Province']; }).filter(function(s) {
  return s && s !== 'N/A' && s.trim() !== '';
}))].sort();
  var rows = data.map(function(p, i) {
    return '<tr style="border-bottom:1px solid #f5f5f5;">'
      + '<td style="padding:12px 14px;color:#888;">' + (i + 1) + '</td>'
      + '<td style="padding:12px 14px;">' + (p.Username || 'N/A') + '</td>'
      + '<td style="padding:12px 14px;"><span style="padding:2px 10px;background:#f5f5f5;border-radius:4px;font-size:12px;">' + (p.Tier || 'N/A') + '</span></td>'
      + '<td style="padding:12px 14px;">' + (p.XP || 0) + '</td>'
      + '<td style="padding:12px 14px;">' + (p['State/Province'] || 'N/A') + '</td>'
      + '<td style="padding:12px 14px;">' + (p.Country || 'N/A') + '</td>'
      + '</tr>';
  }).join('');
  var countryOptions = countries.map(function(c) {
    return '<option value="' + c + '" ' + (c === country ? 'selected' : '') + '>' + c + '</option>';
  }).join('');
  var stateOptions = states.map(function(s) {
    return '<option value="' + s + '" ' + (s === state ? 'selected' : '') + '>' + s + '</option>';
  }).join('');
  container.innerHTML = ''
    + '<div style="padding:0 16px;overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;box-sizing:border-box;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Player leaderboard</h2>'
    + '<div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap;">'
    + '<input id="lb-search" type="text" placeholder="Search" value="' + search + '" oninput="loadLeaderboard()" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;" />'
    + '<select id="lb-country" onchange="loadLeaderboard()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;"><option value="">Country</option>' + countryOptions + '</select>'
    + '<select id="lb-state" onchange="loadLeaderboard()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;"><option value="">State/Province</option>' + stateOptions + '</select>'
    + '</div>'
    + '<table style="min-width:600px;width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:1px solid #eee;">'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;"># Rank</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Username</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Tier</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">XP Earned</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">State/Province</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Country</th>'
    + '</tr></thead>'
    + '<tbody>' + (rows || '<tr><td colspan="6" style="padding:2rem;text-align:center;color:#888;">No players found</td></tr>') + '</tbody>'
    + '</table>';
};



// ========================================
// BADGES DASHBOARD
// ========================================
window.addEventListener('load', function() {
  if (document.getElementById('badges-container')) {
    window.loadBadges();
  }
});

window.loadBadges = async function() {
  var container = document.getElementById('badges-container');
  if (!container) return;
  var result = await window._supabase
    .from('Badges')
    .select('"Name", "Notes", "URL", "Badge Image URL", "Season", "Start Date", "End Date", "Badge #"')
    .order('"Badge #"', { ascending: true });
  var data = result.data;
  var error = result.error;
  if (error) { console.error(error); return; }
  var items = data.map(function(b) {
    var badgeId = 'badge-' + (b['Badge #'] || Math.random());
    return '<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border-bottom:1px solid #f0f0f0;">'
      + '<img src="' + (b['Badge Image URL'] || '') + '" alt="' + b.Name + '" style="width:64px;height:64px;object-fit:contain;border-radius:8px;background:#f5f5f5;flex-shrink:0;" />'
      + '<div style="flex:1;">'
      + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 4px;">' + b.Name + '</p>'
      + '<p style="font-size:13px;color:#555;margin:0 0 6px;">' + (b.Notes || '') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0 0 2px;">Start: ' + (b['Start Date'] || 'N/A') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0 0 2px;">End: ' + (b['End Date'] || 'N/A') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0;">Season: ' + (b.Season || 'N/A') + '</p>'
      + '</div>'
+ '<button onclick="showBadgeModal(this)" data-badge=\'' + JSON.stringify(b).replace(/'/g, '&#39;') + '\' style="font-size:12px;color:#555;cursor:pointer;white-space:nowrap;align-self:center;padding:6px 12px;border:1px solid #ddd;border-radius:6px;background:#fff;">View →</button>'
      + '</div>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Badges</h2>'
    + '<div style="background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">'
    + (items || '<p style="padding:2rem;text-align:center;color:#888;">No badges found</p>')
    + '</div>'
    + '</div>';
};

window.showBadgeModal = function(btnOrData) {
  var b = (btnOrData && btnOrData.dataset) ? JSON.parse(btnOrData.dataset.badge) : btnOrData;
  var existing = document.getElementById('badge-modal-overlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'badge-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
  overlay.innerHTML = ''
    + '<div style="background:#fff;border-radius:16px;max-width:380px;width:100%;padding:28px;text-align:center;position:relative;">'
    + '<button onclick="document.getElementById(\'badge-modal-overlay\').remove()" style="position:absolute;top:12px;right:14px;background:none;border:none;font-size:20px;cursor:pointer;color:#888;">×</button>'
+ '<img src="' + (b['Badge Image URL'] || '') + '" style="width:180px;height:180px;object-fit:contain;border-radius:12px;background:#f5f5f5;margin-bottom:16px;" />'
    + '<h3 style="font-size:18px;font-weight:600;color:#111;margin:0 0 8px;">' + escHtml(b.Name || '') + '</h3>'
    + '<p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">' + escHtml(b.Notes || '') + '</p>'
    + '<p style="font-size:12px;color:#888;margin:0;">Season: ' + escHtml(b.Season || 'N/A') + ' · ' + escHtml(b['Start Date'] || '') + ' – ' + escHtml(b['End Date'] || '') + '</p>'
    + '</div>';
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
};



// ========================================
// COURT DIRECTORY
// ========================================
window.addEventListener('load', function() {
  if (document.getElementById('courts-container')) {
    window.loadCourts();
  }
});

window.loadCourts = async function() {
  var container = document.getElementById('courts-container');
  if (!container) return;
  var search   = document.getElementById('courts-search')   ? document.getElementById('courts-search').value.toLowerCase()  : '';
  var city     = document.getElementById('courts-city')     ? document.getElementById('courts-city').value    : '';
  var state    = document.getElementById('courts-state')    ? document.getElementById('courts-state').value   : '';
  var type     = document.getElementById('courts-type')     ? document.getElementById('courts-type').value    : '';
  var verified = document.getElementById('courts-verified') ? document.getElementById('courts-verified').value : '';

  var result = await window._supabase
    .from('Courts')
    .select('court_id, court_name, address, city, state, zip_code, "Country", court_type, verified')
    .order('court_name', { ascending: true });

  var data = result.data;
  var error = result.error;
  if (error) { console.error(error); return; }
  var allData = data;

  if (search) {
    data = data.filter(function(c) {
      return (c.court_name || '').toLowerCase().includes(search)
        || (c.address     || '').toLowerCase().includes(search)
        || (c.city        || '').toLowerCase().includes(search);
    });
  }
  if (city)     data = data.filter(function(c) { return c.city       === city; });
  if (state)    data = data.filter(function(c) { return c.state      === state; });
  if (type)     data = data.filter(function(c) { return c.court_type === type; });
  if (verified !== '') data = data.filter(function(c) { return c.verified === parseInt(verified); });

  var cities = [...new Set(allData.map(function(c) { return c.city;       }).filter(Boolean))].sort();
  var states = [...new Set(allData.map(function(c) { return c.state;      }).filter(Boolean))].sort();
  var types  = [...new Set(allData.map(function(c) { return c.court_type; }).filter(Boolean))].sort();

  var rows = data.map(function(c) {
    var verifiedBadge = c.verified === 1
      ? '<span style="padding:2px 8px;background:#e6f4ea;color:#2d7a3a;border-radius:4px;font-size:11px;font-weight:500;">Verified</span>'
      : '<span style="padding:2px 8px;background:#f5f5f5;color:#888;border-radius:4px;font-size:11px;">Unverified</span>';
    return '<tr style="border-bottom:1px solid #f5f5f5;">'
      + '<td style="padding:12px 8px;color:#111;font-weight:500;">' + (c.court_name || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.address    || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.city       || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.state      || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.zip_code   || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.Country    || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">'                 + (c.court_type || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;">'                            + verifiedBadge           + '</td>'
      + '</tr>';
  }).join('');

  var cityOptions  = cities.map(function(c) { return '<option value="'+c+'"'+(c===city  ?' selected':'')+'>'+c+'</option>'; }).join('');
  var stateOptions = states.map(function(s) { return '<option value="'+s+'"'+(s===state ?' selected':'')+'>'+s+'</option>'; }).join('');
  var typeOptions  = types.map(function(t)  { return '<option value="'+t+'"'+(t===type  ?' selected':'')+'>'+t+'</option>'; }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Court Directory</h2>'
    + '<div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap;">'
    + '<input id="courts-search" type="text" placeholder="Search courts..." value="' + search + '" oninput="loadCourts()" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;" />'
    + '<select id="courts-city"     onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">City</option>'          + cityOptions  + '</select>'
    + '<select id="courts-state"    onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">State</option>'         + stateOptions + '</select>'
    + '<select id="courts-type"     onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">Indoor/Outdoor</option>' + typeOptions  + '</select>'
    + '<select id="courts-verified" onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;">'
    + '<option value="">All Courts</option>'
    + '<option value="1"' + (verified === '1' ? ' selected' : '') + '>Verified Only</option>'
    + '<option value="0"' + (verified === '0' ? ' selected' : '') + '>Unverified Only</option>'
    + '</select>'
    + '</div>'
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%;display:block;box-sizing:border-box;">'
    + '<table style="min-width:900px;width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:1px solid #eee;">'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Court Name</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Address</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">City</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">State</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Zip</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Country</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Type</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Status</th>'
    + '</tr></thead>'
    + '<tbody>'
    + (rows || '<tr><td colspan="8" style="padding:2rem;text-align:center;color:#888;">No courts found</td></tr>')
    + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';
};



// ========================================
// USERNAME CHECKER (signup page variant 1)
// ========================================
var usernameAvailable = false;
var usernameTimeout;

window.addEventListener('load', function() {
  var input = document.getElementById('username');
  var btn = document.getElementById('submit-username-btn');
  if (!input) return;
  if (btn) btn.disabled = true;
  input.addEventListener('input', function() {
    var username = input.value.trim();
    var result = document.getElementById('username-result');
    if (!result) {
      result = document.createElement('div');
      result.id = 'username-result';
      result.style.fontSize = '13px';
      result.style.marginTop = '6px';
      result.style.minHeight = '20px';
      input.parentNode.insertBefore(result, input.nextSibling);
    }
    usernameAvailable = false;
    if (btn) btn.disabled = true;
    if (!username) { result.innerHTML = ''; return; }
    if (username.length < 6) {
      result.innerHTML = '<span style="color:#888;">Must be at least 6 characters</span>';
      return;
    }
    result.innerHTML = '<span style="color:#888;">Checking...</span>';
    clearTimeout(usernameTimeout);
    usernameTimeout = setTimeout(async function() {
      var response = await window._supabase
        .from('Players')
        .select('"Username"')
        .ilike('"Username"', username)
        .limit(1);
      var data = response.data;
      var error = response.error;
      if (error) { result.innerHTML = '<span style="color:#888;">Error checking username</span>'; return; }
      if (data && data.length > 0) {
        usernameAvailable = false;
        if (btn) btn.disabled = true;
        result.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#e24b4a;display:inline-block;"></span><span style="color:#e24b4a;">Username taken — please try another</span></div>';
      } else {
        usernameAvailable = true;
        if (btn) btn.disabled = false;
        result.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#2d7a3a;display:inline-block;"></span><span style="color:#2d7a3a;">Username available</span></div>';
      }
    }, 400);
  });
});



// ========================================
// USERNAME CHECKER (variant 2)
// ========================================
var usernameAvailable2 = false;
var usernameTimeout2;

window.addEventListener('load', function() {
  var input = document.getElementById('username-2');
  var btn = document.getElementById('submit-username-btn-2');
  if (!input) return;
  if (btn) btn.disabled = true;
  input.addEventListener('input', function() {
    var username = input.value.trim();
    var result = document.getElementById('username-result-2');
    usernameAvailable2 = false;
    if (btn) btn.disabled = true;
    if (!username) { result.innerHTML = ''; return; }
    if (username.length < 6) {
      result.innerHTML = '<span style="color:#888;">Must be at least 6 characters</span>';
      return;
    }
    result.innerHTML = '<span style="color:#888;">Checking...</span>';
    clearTimeout(usernameTimeout2);
    usernameTimeout2 = setTimeout(async function() {
      var response = await window._supabase
        .from('Players')
        .select('"Username"')
        .ilike('"Username"', username)
        .limit(1);
      var data = response.data;
      var error = response.error;
      if (error) { result.innerHTML = '<span style="color:#888;">Error checking username</span>'; return; }
      if (data && data.length > 0) {
        usernameAvailable2 = false;
        if (btn) btn.disabled = true;
        result.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#e24b4a;display:inline-block;"></span><span style="color:#e24b4a;">Username taken — please try another</span></div>';
      } else {
        usernameAvailable2 = true;
        if (btn) btn.disabled = false;
        result.innerHTML = '<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#2d7a3a;display:inline-block;"></span><span style="color:#2d7a3a;">Username available</span></div>';
      }
    }, 400);
  });
});

function formatPostTime(isoString) {
  var d = new Date(isoString);
  var now = new Date();
  var diffMs = now - d;
  var diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ========================================
// SOCIAL FEED
// ========================================
var currentPlayerEmail = null;
var currentPlayerProfileNumber = null;
var socialFeedPage = 0;
var socialFeedLoading = false;
var socialFeedDone = false;
var POSTS_PER_LOAD = 10;

window.addEventListener('load', async function() {
  if (!document.getElementById('social-feed-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.initSocialFeed();
});

window.initSocialFeed = function() {
  var container = document.getElementById('social-feed-container');
  if (!container) return;

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Social Feed</h2>'
    + '<div id="social-feed-posts" style="display:flex;flex-direction:column;gap:20px;"></div>'
    + '<div id="social-feed-loader" style="text-align:center;padding:20px;color:#888;font-size:14px;">Loading more posts...</div>'
    + '<div id="social-feed-end" style="text-align:center;padding:20px;color:#888;font-size:14px;display:none;">You\'ve reached the end</div>'
    + '</div>';

  window.loadMoreSocialFeed();

  window.addEventListener('scroll', function() {
    if (socialFeedLoading || socialFeedDone) return;
    var scrollPos = window.innerHeight + window.scrollY;
    var threshold = document.body.offsetHeight - 500;
    if (scrollPos >= threshold) {
      window.loadMoreSocialFeed();
    }
  });
};

window.loadMoreSocialFeed = async function() {
  if (socialFeedLoading || socialFeedDone) return;
  socialFeedLoading = true;

  var from = socialFeedPage * POSTS_PER_LOAD;
  var to = from + POSTS_PER_LOAD - 1;

  var result = await window._supabase
    .from('Social Feed')
    .select('"Feed Posts", "Post", "Attachments", "Players", "Court Name", "Date", "player_id"')
    .order('"Date"', { ascending: false })
    .range(from, to);

  var data = result.data;
  var error = result.error;

  if (error) { console.error(error); socialFeedLoading = false; return; }

  if (!data || data.length === 0) {
    socialFeedDone = true;
    var loader = document.getElementById('social-feed-loader');
    var endMsg = document.getElementById('social-feed-end');
    if (loader) loader.style.display = 'none';
    if (endMsg) endMsg.style.display = 'block';
    socialFeedLoading = false;
    return;
  }

  var postsContainer = document.getElementById('social-feed-posts');
  var newPosts = data.map(function(post) {
    var isOwner = currentPlayerProfileNumber && post.player_id == currentPlayerProfileNumber;
    var deleteBtn = isOwner
      ? '<button onclick="deletePost(\'' + post['Feed Posts'] + '\')" style="padding:8px 16px;background:#fff;color:#111;border:1px solid #ddd;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Delete Post</button>'
      : '';
    return '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;background:#fff;">'
      + '<div style="position:relative;">'
      + '<img src="' + (post.Attachments || '') + '" style="width:100%;max-height:500px;object-fit:cover;display:block;" />'
      + '<span style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;padding:5px 12px;border-radius:20px;font-weight:500;">' + (post.Players || '') + '</span>'
      + '</div>'
      + '<div style="padding:16px 18px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">'
      + '<span style="font-size:12px;color:#888;">' + (post.Date ? formatPostTime(post.Date) : 'N/A') + '</span>'
      + '<span style="font-size:12px;color:#888;">' + (post['Court Name'] || 'N/A') + '</span>'
      + '</div>'
      + (post.Post ? '<p style="font-size:15px;color:#111;margin:0 0 14px;line-height:1.5;">' + post.Post + '</p>' : '')
      + '<div style="display:flex;gap:8px;">'
      + '<button onclick="reportPost(\'' + post['Feed Posts'] + '\')" style="padding:8px 16px;background:#378add;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Report Post</button>'
      + deleteBtn
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  postsContainer.insertAdjacentHTML('beforeend', newPosts);

  if (data.length < POSTS_PER_LOAD) {
    socialFeedDone = true;
    var loader = document.getElementById('social-feed-loader');
    var endMsg = document.getElementById('social-feed-end');
    if (loader) loader.style.display = 'none';
    if (endMsg) endMsg.style.display = 'block';
  }

  socialFeedPage++;
  socialFeedLoading = false;
};

window.reportPost = async function(postId) {
  if (!currentPlayerEmail) { alert('You must be logged in to report a post.'); return; }
  var reason = prompt('Why are you reporting this post? (inappropriate, harassment, spam)');
  if (!reason) return;
  var insert = await window._supabase
    .from('Report Dashboard')
    .insert({
      post_id: postId,
      reported_by_email: currentPlayerEmail,
      reason: reason,
      reported_at: new Date().toISOString()
    });
  if (insert.error) { console.error(insert.error); alert('Error submitting report. Please try again.'); return; }
  await window._supabase.rpc('increment_report_count', { post_id: postId });
  alert('Report submitted. Thank you.');
};

window.deletePost = async function(postId) {
  if (!currentPlayerProfileNumber) { alert('You must be logged in to delete a post.'); return; }
  if (!confirm('Are you sure you want to delete this post?')) return;
  var result = await window._supabase
    .from('Social Feed')
    .delete()
    .eq('"Feed Posts"', postId)
    .eq('"player_id"', currentPlayerProfileNumber);
  if (result.error) { alert('Error deleting post. Please try again.'); return; }
  socialFeedPage = 0;
  socialFeedDone = false;
  document.getElementById('social-feed-posts').innerHTML = '';
  document.getElementById('social-feed-loader').style.display = 'block';
  document.getElementById('social-feed-end').style.display = 'none';
  window.loadMoreSocialFeed();
};



// ========================================
// PLAYER SEARCH
// ========================================
window.addEventListener('load', async function() {
  if (!document.getElementById('player-search-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.initPlayerSearch();
});

window.initPlayerSearch = function() {
  var container = document.getElementById('player-search-container');
  if (!container) return;

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Find a Player</h2>'
    + '<input id="player-search-input" type="text" placeholder="Search by username..." oninput="searchPlayers()" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:1rem;color:#111;box-sizing:border-box;" />'
    + '<div id="player-search-results" style="display:flex;flex-direction:column;gap:10px;"></div>'
    + '</div>';

  window.searchPlayers();
};

var playerSearchTimeout;
window.searchPlayers = function() {
  clearTimeout(playerSearchTimeout);
  playerSearchTimeout = setTimeout(async function() {
    var input = document.getElementById('player-search-input');
    var resultsContainer = document.getElementById('player-search-results');
    if (!resultsContainer) return;

    var query = input ? input.value.trim() : '';

    var request = window._supabase
      .from('Players')
      .select('"player_id", "Username", "Tier", "State/Province", "Country", "Profile Photo URL"')
      .order('"Username"', { ascending: true })
      .limit(50);

    if (query) {
      request = request.ilike('"Username"', '%' + query + '%');
    }

    var result = await request;
    var data = result.data;
    var error = result.error;

    if (error) { console.error(error); return; }

    if (!data || data.length === 0) {
      resultsContainer.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No players found</p>';
      return;
    }

    var cards = data.map(function(p) {
      if (currentPlayerProfileNumber && p.player_id == currentPlayerProfileNumber) return '';

      var profileUrl = '/profile-view?player_profile_number=' + p.player_id;
      var photo = p['Profile Photo URL']
        ? '<img src="' + p['Profile Photo URL'] + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />'
        : '<div style="width:48px;height:48px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:500;flex-shrink:0;">' + (p.Username ? p.Username.charAt(0).toUpperCase() : '?') + '</div>';

      var addFriendBtn = currentPlayerProfileNumber
        ? '<button onclick="event.preventDefault();event.stopPropagation();sendFriendRequest(' + p.player_id + ', \'' + (p.Username || '') + '\', this)" style="padding:8px 14px;background:#FF5000;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;white-space:nowrap;">Add Friend</button>'
        : '';

      return '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid #eee;border-radius:10px;background:#fff;">'
        + '<a href="' + profileUrl + '" style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;text-decoration:none;color:#111;">'
        + photo
        + '<div style="flex:1;min-width:0;">'
        + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 2px;">' + (p.Username || 'N/A') + '</p>'
        + '<p style="font-size:12px;color:#888;margin:0;">' + (p.Tier || 'N/A') + ' · ' + (p['State/Province'] || 'N/A') + ', ' + (p.Country || 'N/A') + '</p>'
        + '</div>'
        + '</a>'
        + addFriendBtn
        + '</div>';
    }).join('');

    resultsContainer.innerHTML = cards;
  }, 250);
};

window.sendFriendRequest = async function(receiverId, receiverUsername, btn) {
  if (!currentPlayerProfileNumber) { alert('You must be logged in to send friend requests.'); return; }

  btn.disabled = true;
  btn.innerText = 'Sending...';

  var existing = await window._supabase
    .from('Friend Requests')
    .select('id, status')
    .eq('requester_id', currentPlayerProfileNumber)
    .eq('receiver_id', receiverId)
    .limit(1);

  if (existing.data && existing.data.length > 0) {
    btn.innerText = 'Already Sent';
    btn.style.background = '#888';
    return;
  }

  var insert = await window._supabase
    .from('Friend Requests')
    .insert({
      requester_id: currentPlayerProfileNumber,
      receiver_id: receiverId,
      status: 'pending'
    });

  if (insert.error) {
    console.error(insert.error);
    btn.disabled = false;
    btn.innerText = 'Add Friend';
    alert('Error sending friend request. Please try again.');
    return;
  }

  btn.innerText = 'Request Sent';
  btn.style.background = '#2d7a3a';
};



// ========================================
// FRIENDS DASHBOARD
// ========================================
window.addEventListener('load', async function() {
  if (!document.getElementById('friends-dashboard-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.loadFriendsDashboard();
});

window.loadFriendsDashboard = async function() {
  var container = document.getElementById('friends-dashboard-container');
  if (!container) return;

  if (!currentPlayerProfileNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">You must be logged in to view your friends.</p>';
    return;
  }

  var pendingResult = await window._supabase
    .from('Friend Requests')
    .select('id, requester_id, created_at')
    .eq('receiver_id', currentPlayerProfileNumber)
    .eq('status', 'pending');

  var pendingRequests = pendingResult.data || [];

  var requesterIds = pendingRequests.map(function(r) { return r.requester_id; });
  var requesterMap = {};
  if (requesterIds.length > 0) {
    var requestersResult = await window._supabase
      .from('Players')
      .select('"player_id", "Username", "Tier", "State/Province", "Country", "Profile Photo URL"')
      .in('player_id', requesterIds);
    (requestersResult.data || []).forEach(function(p) { requesterMap[p.player_id] = p; });
  }

  var friendshipsResult = await window._supabase
    .from('Friendships')
    .select('*')
    .or('player_1_id.eq.' + currentPlayerProfileNumber + ',player_2_id.eq.' + currentPlayerProfileNumber);

  var friendships = friendshipsResult.data || [];
  var friendIds = friendships.map(function(f) {
    return f.player_1_id == currentPlayerProfileNumber ? f.player_2_id : f.player_1_id;
  });

  var friendsMap = {};
  if (friendIds.length > 0) {
    var friendsResult = await window._supabase
      .from('Players')
      .select('"player_id", "Username", "Tier", "State/Province", "Country", "Profile Photo URL"')
      .in('player_id', friendIds);
    (friendsResult.data || []).forEach(function(p) { friendsMap[p.player_id] = p; });
  }

  var pendingHtml = pendingRequests.length > 0
    ? pendingRequests.map(function(req) {
        var requester = requesterMap[req.requester_id];
        if (!requester) return '';
        var photo = requester['Profile Photo URL']
          ? '<img src="' + requester['Profile Photo URL'] + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />'
          : '<div style="width:48px;height:48px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:500;flex-shrink:0;">' + requester.Username.charAt(0).toUpperCase() + '</div>';
        return '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid #eee;border-radius:10px;background:#fff;margin-bottom:10px;">'
          + photo
          + '<div style="flex:1;min-width:0;">'
          + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 2px;">' + requester.Username + '</p>'
          + '<p style="font-size:12px;color:#888;margin:0;">' + (requester.Tier || '') + ' · ' + (requester['State/Province'] || '') + ', ' + (requester.Country || '') + '</p>'
          + '</div>'
          + '<button onclick="acceptFriendRequest(\'' + req.id + '\', ' + req.requester_id + ')" style="padding:8px 14px;background:#2d7a3a;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Accept</button>'
          + '<button onclick="declineFriendRequest(\'' + req.id + '\')" style="padding:8px 14px;background:#fff;color:#111;border:1px solid #ddd;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Decline</button>'
          + '</div>';
      }).join('')
    : '<p style="color:#888;font-size:14px;">No pending requests.</p>';

  var friendsHtml = friendIds.length > 0
    ? friendIds.map(function(id) {
        var friend = friendsMap[id];
        if (!friend) return '';
        var profileUrl = '/profile-view?player_profile_number=' + friend.player_id;
        var photo = friend['Profile Photo URL']
          ? '<img src="' + friend['Profile Photo URL'] + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" />'
          : '<div style="width:48px;height:48px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:500;flex-shrink:0;">' + friend.Username.charAt(0).toUpperCase() + '</div>';
        return '<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;border:1px solid #eee;border-radius:10px;background:#fff;margin-bottom:10px;">'
          + '<a href="' + profileUrl + '" style="display:flex;align-items:center;gap:14px;flex:1;min-width:0;text-decoration:none;color:#111;">'
          + photo
          + '<div style="flex:1;min-width:0;">'
          + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 2px;">' + friend.Username + '</p>'
          + '<p style="font-size:12px;color:#888;margin:0;">' + (friend.Tier || '') + ' · ' + (friend['State/Province'] || '') + ', ' + (friend.Country || '') + '</p>'
          + '</div>'
          + '</a>'
          + '<button onclick="removeFriend(' + friend.player_id + ')" style="padding:8px 14px;background:#fff;color:#e24b4a;border:1px solid #ddd;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Remove</button>'
          + '</div>';
      }).join('')
    : '<p style="color:#888;font-size:14px;">No friends yet. Find players to add from the Player Search.</p>';

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1rem;color:#111;">Pending Requests' + (pendingRequests.length > 0 ? ' (' + pendingRequests.length + ')' : '') + '</h2>'
    + '<div style="margin-bottom:2rem;">' + pendingHtml + '</div>'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1rem;color:#111;">Your Friends' + (friendIds.length > 0 ? ' (' + friendIds.length + ')' : '') + '</h2>'
    + '<div>' + friendsHtml + '</div>'
    + '</div>';
};

window.acceptFriendRequest = async function(requestId, requesterId) {
  if (!currentPlayerProfileNumber) return;

  var updateResult = await window._supabase
    .from('Friend Requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (updateResult.error) {
    console.error(updateResult.error);
    alert('Error accepting request.');
    return;
  }

  var p1 = Math.min(requesterId, currentPlayerProfileNumber);
  var p2 = Math.max(requesterId, currentPlayerProfileNumber);

  var insertResult = await window._supabase
    .from('Friendships')
    .insert({
      player_1_id: p1,
      player_2_id: p2
    });

  if (insertResult.error) {
    console.error(insertResult.error);
  }

  window.loadFriendsDashboard();
};

window.declineFriendRequest = async function(requestId) {
  var result = await window._supabase
    .from('Friend Requests')
    .delete()
    .eq('id', requestId);

  if (result.error) {
    console.error(result.error);
    alert('Error declining request.');
    return;
  }

  window.loadFriendsDashboard();
};

window.removeFriend = async function(friendId) {
  if (!confirm('Remove this friend?')) return;

  var p1 = Math.min(friendId, currentPlayerProfileNumber);
  var p2 = Math.max(friendId, currentPlayerProfileNumber);

  var friendshipResult = await window._supabase
    .from('Friendships')
    .delete()
    .eq('player_1_id', p1)
    .eq('player_2_id', p2);

  if (friendshipResult.error) {
    console.error(friendshipResult.error);
    alert('Error removing friend.');
    return;
  }

  await window._supabase
    .from('Friend Requests')
    .delete()
    .or('and(requester_id.eq.' + currentPlayerProfileNumber + ',receiver_id.eq.' + friendId + '),and(requester_id.eq.' + friendId + ',receiver_id.eq.' + currentPlayerProfileNumber + ')');

  window.loadFriendsDashboard();
};



// ========================================
// VERIFY SESSIONS
// ========================================
window.addEventListener('load', async function () {
  if (!document.getElementById('verify-sessions-container')) return;

  var player = await getCurrentPlayer();
  currentPlayerEmail    = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.loadVerifySessions();
});

window.loadVerifySessions = async function () {
  var container = document.getElementById('verify-sessions-container');
  if (!container) return;

  if (!currentPlayerProfileNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">You must be logged in to verify sessions.</p>';
    return;
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<div style="display:flex;align-items:center;gap:10px;padding-top:8px;margin-bottom:8px;">'
    + '<h2 style="font-size:22px;font-weight:500;color:#111;margin:0;">Verify Sessions</h2>'
    + '<div id="vs-badge" style="display:none;background:#0060ff;border-radius:12px;padding:2px 10px;min-width:24px;text-align:center;">'
    + '<span id="vs-badge-count" style="color:#fff;font-size:13px;font-weight:700;"></span>'
    + '</div>'
    + '</div>'
    + '<p style="font-size:13px;color:#888;margin:0 0 1.25rem;line-height:1.5;">'
    + 'Confirm or dispute sessions from players you ran with. You earn +5 XP when your vote matches the majority.'
    + '</p>'
    + '<div id="vs-list" style="display:flex;flex-direction:column;gap:14px;">'
    + '<div style="text-align:center;padding:40px 0;color:#888;font-size:14px;">Loading sessions...</div>'
    + '</div>'
    + '</div>';

  // ── Fetch via RPC — same call the app uses ─────────────────────────────────
  var rpcResult = await window._supabase.rpc('get_sessions_to_verify', {
    p_player_id: currentPlayerProfileNumber
  });

  if (rpcResult.error) {
    console.error('get_sessions_to_verify error:', rpcResult.error);
    document.getElementById('vs-list').innerHTML =
      '<p style="text-align:center;color:#888;font-size:14px;padding:40px 0;">Could not load sessions. Please try again.</p>';
    return;
  }

  var sessions = rpcResult.data || [];

  window._vsSessions = sessions; // keep in memory for card removal

  window.renderVerifySessions();
};

window.renderVerifySessions = function () {
  var list = document.getElementById('vs-list');
  if (!list) return;

  var sessions = window._vsSessions || [];

  // ── Update badge count ────────────────────────────────────────────────────
  var badge      = document.getElementById('vs-badge');
  var badgeCount = document.getElementById('vs-badge-count');
  if (badge && badgeCount) {
    if (sessions.length > 0) {
      badgeCount.textContent = sessions.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    list.innerHTML = ''
      + '<div style="text-align:center;padding:60px 20px;">'
      + '<p style="font-size:2.5rem;margin:0 0 12px;">✅</p>'
      + '<p style="font-size:17px;font-weight:600;color:#111;margin:0 0 6px;">All caught up</p>'
      + '<p style="font-size:14px;color:#888;line-height:1.6;margin:0;">'
      + 'No sessions to verify right now.<br>Sessions appear here when players you ran with complete their sessions.'
      + '</p>'
      + '</div>';
    return;
  }

  // ── Render cards ──────────────────────────────────────────────────────────
  list.innerHTML = sessions.map(function (s) {
    return window.buildVerifyCard(s);
  }).join('');

  // Wire up buttons
  sessions.forEach(function (s) {
    var confirmBtn = document.getElementById('vs-confirm-' + s.session_id);
    var disputeBtn = document.getElementById('vs-dispute-' + s.session_id);
    if (confirmBtn) confirmBtn.addEventListener('click', function () {
      window.submitVerification(s.session_id, s.owner_player_id, s.court_id, 'confirmed');
    });
    if (disputeBtn) disputeBtn.addEventListener('click', function () {
      window.submitVerification(s.session_id, s.owner_player_id, s.court_id, 'disputed');
    });
  });
};

// ── Build a single card (mirrors the app's renderSession) ─────────────────────
window.buildVerifyCard = function (s) {
  var photoHtml = s.photo_url
    ? '<img src="' + s.photo_url + '" onclick="vsShowPhotoModal(\'' + s.photo_url + '\')" style="width:100%;max-height:220px;object-fit:cover;display:block;cursor:pointer;" title="Tap to enlarge" />'
    : '';

  var windowText  = vsFormatWindowClosing(s.validation_closes_at);
  var timeAgoText = vsFormatTimeAgo(s.start_time);
  var duration    = vsFormatDuration(s.start_time, s.end_time);
  var sessionTime = vsFormatSessionTime(s.start_time, s.end_time);

  return ''
    + '<div id="vs-card-' + s.session_id + '" style="border:1px solid #eee;border-radius:12px;background:#fff;overflow:hidden;">'
    + photoHtml
    + '<div style="padding:14px 16px;">'

    // Header row: username + closing window badge
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
    + '<p style="font-size:16px;font-weight:600;color:#111;margin:0;">' + escHtml(s.owner_username || 'Player ' + s.owner_player_id) + '</p>'
    + '<span style="background:#f5f5f5;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:600;color:#555;">' + windowText + '</span>'
    + '</div>'

    // Court
    + '<p style="font-size:13px;color:#888;margin:0 0 2px;">📍 ' + escHtml(s.court_name || 'Court ' + s.court_id) + '</p>'

    // Time
    + '<p style="font-size:12px;color:#888;margin:0 0 14px;">' + sessionTime + ' · ' + duration + ' session · ' + timeAgoText + '</p>'

    // Buttons
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    + '<button id="vs-confirm-' + s.session_id + '" style="flex:1;min-width:120px;padding:11px 12px;background:rgba(0,96,255,0.1);color:#0060ff;border:1px solid rgba(0,96,255,0.3);border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">'
    + '✓ ' + escHtml(s.owner_username || 'They') + ' was there'
    + '</button>'
    + '<button id="vs-dispute-' + s.session_id + '" style="flex:1;min-width:120px;padding:11px 12px;background:#fff;color:#888;border:1px solid #ddd;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">'
    + '✕ ' + escHtml(s.owner_username || 'They') + ' wasn\'t there'
    + '</button>'
    + '</div>'

    + '</div>'
    + '</div>';
};

// ── Submit — writes to session_validations, mirrors app's handleValidate ──────
window.submitVerification = async function (sessionId, sessionOwnerId, courtId, vote) {
  if (!currentPlayerProfileNumber) { alert('You must be logged in.'); return; }

  // Disable both buttons immediately (prevent double-tap)
  var confirmBtn = document.getElementById('vs-confirm-' + sessionId);
  var disputeBtn = document.getElementById('vs-dispute-' + sessionId);
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.style.opacity = '0.4'; }
  if (disputeBtn) { disputeBtn.disabled = true; disputeBtn.style.opacity = '0.4'; }

  var result = await window._supabase
    .from('session_validations')
    .insert({
      session_id:          sessionId,
      validator_player_id: currentPlayerProfileNumber,
      session_owner_id:    sessionOwnerId,
      court_id:            courtId,
      validation_result:   vote
    });

  if (result.error) {
    console.error('Validation insert error:', result.error);

    // 23505 = unique constraint — already validated; remove card silently (same as app)
    if (result.error.code === '23505') {
      vsRemoveCard(sessionId);
      vsShowToast('Already validated');
      return;
    }

    // Re-enable buttons on other errors
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.style.opacity = '1'; }
    if (disputeBtn) { disputeBtn.disabled = false; disputeBtn.style.opacity = '1'; }
    vsShowToast('Error submitting — please try again');
    return;
  }

  // Success — remove card from list
  vsRemoveCard(sessionId);
  vsShowToast('Validation submitted! +5 XP if your vote matches the majority.');
};

// ── Remove a card from in-memory list and re-render ───────────────────────────
function vsRemoveCard(sessionId) {
  window._vsSessions = (window._vsSessions || []).filter(function (s) {
    return s.session_id !== sessionId;
  });
  // Animate card out, then re-render
  var card = document.getElementById('vs-card-' + sessionId);
  if (card) {
    card.style.transition = 'opacity 0.25s';
    card.style.opacity = '0';
    setTimeout(function () { window.renderVerifySessions(); }, 260);
  } else {
    window.renderVerifySessions();
  }
}
// ── Photo zoom modal ──────────────────────────────────────────────────────────
function vsShowPhotoModal(url) {
  var existing = document.getElementById('vs-photo-modal');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'vs-photo-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;cursor:pointer;';
  overlay.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.5);" />';
  overlay.addEventListener('click', function() { overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function vsShowToast(msg) {
  var existing = document.getElementById('vs-toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.id = 'vs-toast';
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);'
    + 'background:#111;color:#fff;padding:12px 22px;border-radius:8px;font-size:14px;'
    + 'font-family:inherit;z-index:9999;white-space:nowrap;max-width:calc(100vw - 48px);'
    + 'text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.25);'
    + 'opacity:0;transition:opacity 0.2s;';
  document.body.appendChild(toast);
  requestAnimationFrame(function () { toast.style.opacity = '1'; });
  setTimeout(function () {
    toast.style.opacity = '0';
    setTimeout(function () { toast.remove(); }, 220);
  }, 2800);
}

// ── Time/date helpers (mirrors app formatters) ────────────────────────────────
function vsFormatWindowClosing(isoString) {
  if (!isoString) return 'Window closing';
  var diff  = new Date(isoString).getTime() - Date.now();
  var hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1)  return 'Closes in < 1h';
  if (hours < 24) return 'Closes in ' + hours + 'h';
  return 'Closes in ' + Math.floor(hours / 24) + 'd';
}

function vsFormatTimeAgo(isoString) {
  var diff  = Date.now() - new Date(isoString).getTime();
  var hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1)  return 'Less than an hour ago';
  if (hours < 24) return hours + 'h ago';
  return Math.floor(hours / 24) + 'd ago';
}

function vsFormatDuration(start, end) {
  var diff = new Date(end).getTime() - new Date(start).getTime();
  var mins = Math.floor(diff / (1000 * 60));
  if (mins < 60) return mins + 'm';
  var h = Math.floor(mins / 60);
  var m = mins % 60;
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
}

function vsFormatSessionTime(start, end) {
  var opts = { hour: 'numeric', minute: '2-digit', hour12: true };
  var startDate = new Date(start);
  var endDate   = new Date(end);
  var now       = new Date();

  var isToday     = startDate.toDateString() === now.toDateString();
  var yesterday   = new Date(now); yesterday.setDate(now.getDate() - 1);
  var isYesterday = startDate.toDateString() === yesterday.toDateString();

  var dayLabel = isToday     ? 'Today'
               : isYesterday ? 'Yesterday'
               : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return dayLabel + ', '
    + startDate.toLocaleTimeString('en-US', opts)
    + ' – '
    + endDate.toLocaleTimeString('en-US', opts);
}

// ── XSS guard ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}



// ========================================
// LIVE COURT FEED
// ========================================
window.addEventListener('load', function() {
  if (document.getElementById('live-court-feed-container')) {
    window.initLiveCourtFeed();
  }
});

var liveCourtFeedSubscription = null;

window.initLiveCourtFeed = async function() {
  var container = document.getElementById('live-court-feed-container');
  if (!container) return;

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:8px;color:#111;">Live Court Feed</h2>'
    + '<p style="font-size:13px;color:#888;margin-bottom:1rem;">See how busy each court is right now. Updates automatically.</p>'
    + '<input id="lcf-search" type="text" placeholder="Search courts..." oninput="renderLiveCourtFeed()" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:1rem;color:#111;box-sizing:border-box;" />'
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%;box-sizing:border-box;">'
    + '<table style="min-width:700px;width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:1px solid #eee;">'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Court Name</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Active Now</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Address</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">City</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">State</th>'
    + '<th style="text-align:left;padding:10px 8px;color:#888;font-weight:500;">Country</th>'
    + '</tr></thead>'
    + '<tbody id="lcf-body"><tr><td colspan="6" style="padding:2rem;text-align:center;color:#888;">Loading...</td></tr></tbody>'
    + '</table>'
    + '</div>'
    + '</div>';

  await window.loadLiveCourtFeedData();

  liveCourtFeedSubscription = window._supabase
    .channel('live-court-feed-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'Sessions Forms' },
      function() {
        window.loadLiveCourtFeedData();
      }
    )
    .subscribe();
};

window.liveCourtFeedData = [];

window.loadLiveCourtFeedData = async function() {
  var courtsResult = await window._supabase
    .from('Courts')
    .select('court_id, court_name, address, city, state, "Country"')
    .order('court_name', { ascending: true });

  var courts = courtsResult.data || [];

  var activeSessionsResult = await window._supabase
    .from('Sessions Forms')
    .select('court_id')
    .is('end_time', null);

  var activeSessions = activeSessionsResult.data || [];

  var activeCounts = {};
  activeSessions.forEach(function(s) {
    activeCounts[s.court_id] = (activeCounts[s.court_id] || 0) + 1;
  });

  window.liveCourtFeedData = courts.map(function(c) {
    return {
      courtId:     c.court_id,
      courtName:   c.court_name,
      address:     c.address,
      city:        c.city,
      state:       c.state,
      country:     c.Country,
      activeCount: activeCounts[c.court_id] || 0
    };
  });

  window.renderLiveCourtFeed();
};

window.renderLiveCourtFeed = function() {
  var body = document.getElementById('lcf-body');
  if (!body) return;

  var searchInput = document.getElementById('lcf-search');
  var search = searchInput ? searchInput.value.toLowerCase() : '';

  var filtered = window.liveCourtFeedData;
  if (search) {
    filtered = filtered.filter(function(c) {
      return (c.courtName || '').toLowerCase().includes(search)
        || (c.city || '').toLowerCase().includes(search)
        || (c.address || '').toLowerCase().includes(search);
    });
  }

  filtered.sort(function(a, b) {
    if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
    return (a.courtName || '').localeCompare(b.courtName || '');
  });

  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="padding:2rem;text-align:center;color:#888;">No courts found</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(function(c) {
    var badge = c.activeCount > 0
      ? '<span style="padding:3px 10px;background:#e6f4ea;color:#2d7a3a;border-radius:12px;font-size:12px;font-weight:500;"><span style="display:inline-block;width:6px;height:6px;background:#2d7a3a;border-radius:50%;margin-right:5px;"></span>' + c.activeCount + ' active</span>'
      : '<span style="padding:3px 10px;background:#f5f5f5;color:#888;border-radius:12px;font-size:12px;">0</span>';

    return '<tr style="border-bottom:1px solid #f5f5f5;">'
      + '<td style="padding:12px 8px;color:#111;font-weight:500;">' + (c.courtName || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;">' + badge + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c.address || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c.city || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c.state || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c.country || 'N/A') + '</td>'
      + '</tr>';
  }).join('');
};



// ========================================
// SF PLAYER (Player-specific social feed)
// ========================================
var sfPlayerPage = 0;
var sfPlayerLoading = false;
var sfPlayerDone = false;
var sfPlayerTargetId = null;

window.addEventListener('load', function() {
  if (!document.getElementById('sf-player-container')) return;

  var urlParams = new URLSearchParams(window.location.search);
  sfPlayerTargetId = urlParams.get('player_profile_number');
   if (!sfPlayerTargetId && window.location.pathname === '/profile') return; // handled by personal profile loader

  if (!sfPlayerTargetId) {
    var personalDiv = document.getElementById('personal-player-number');
    if (personalDiv) {
      sfPlayerTargetId = (personalDiv.innerText || personalDiv.textContent || '').trim();
    }
  }

  if (!sfPlayerTargetId) {
    document.getElementById('sf-player-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No player specified.</p>';
    return;
  }

  window.initSFPlayer();
});

window.initSFPlayer = function() {
  var container = document.getElementById('sf-player-container');
  if (!container) return;

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:20px;font-weight:500;margin-bottom:1.25rem;color:#111;">Posts</h2>'
    + '<div id="sf-player-posts" style="display:flex;flex-direction:column;gap:20px;"></div>'
    + '<div id="sf-player-loader" style="text-align:center;padding:20px;color:#888;font-size:14px;">Loading...</div>'
    + '<div id="sf-player-end" style="text-align:center;padding:20px;color:#888;font-size:14px;display:none;">No more posts</div>'
    + '</div>';

  window.loadMoreSFPlayer();

  window.addEventListener('scroll', function() {
    if (sfPlayerLoading || sfPlayerDone) return;
    var scrollPos = window.innerHeight + window.scrollY;
    var threshold = document.body.offsetHeight - 500;
    if (scrollPos >= threshold) {
      window.loadMoreSFPlayer();
    }
  });
};

window.loadMoreSFPlayer = async function() {
  if (sfPlayerLoading || sfPlayerDone) return;
  sfPlayerLoading = true;

  var from = sfPlayerPage * POSTS_PER_LOAD;
  var to = from + POSTS_PER_LOAD - 1;

  var result = await window._supabase
    .from('Social Feed')
    .select('"Feed Posts", "Post", "Attachments", "Players", "Court Name", "Date", "player_id"')
    .eq('player_id', sfPlayerTargetId)
    .order('"Date"', { ascending: false })
    .range(from, to);

  var data = result.data;
  var error = result.error;

  if (error) { console.error(error); sfPlayerLoading = false; return; }

  if (!data || data.length === 0) {
    sfPlayerDone = true;
    var loader = document.getElementById('sf-player-loader');
    var endMsg = document.getElementById('sf-player-end');
    if (loader) loader.style.display = 'none';
    if (endMsg) {
      endMsg.style.display = 'block';
      if (sfPlayerPage === 0) endMsg.innerText = 'This player has no posts yet.';
    }
    sfPlayerLoading = false;
    return;
  }

var postsContainer = document.getElementById('sf-player-posts');
  var newPosts = data.map(function(post) {
    var isOwner = currentPlayerProfileNumber && post.player_id == currentPlayerProfileNumber;
    var reportBtn = !isOwner && currentPlayerProfileNumber
      ? '<button onclick="reportPost(\'' + post['Feed Posts'] + '\')" style="padding:8px 16px;background:#378add;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Report Post</button>'
      : '';
    var deleteBtn = isOwner
      ? '<button onclick="deletePost(\'' + post['Feed Posts'] + '\')" style="padding:8px 16px;background:#fff;color:#111;border:1px solid #ddd;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">Delete Post</button>'
      : '';
    return '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;background:#fff;">'
      + '<div style="position:relative;">'
      + '<img src="' + (post.Attachments || '') + '" style="width:100%;max-height:500px;object-fit:cover;display:block;" />'
      + '<span style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;padding:5px 12px;border-radius:20px;font-weight:500;">' + (post.Players || '') + '</span>'
      + '</div>'
      + '<div style="padding:16px 18px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">'
      + '<span style="font-size:12px;color:#888;">' + (post.Date ? formatPostTime(post.Date) : 'N/A') + '</span>'
      + '<span style="font-size:12px;color:#888;">' + (post['Court Name'] || 'N/A') + '</span>'
      + '</div>'
      + (post.Post ? '<p style="font-size:15px;color:#111;margin:0 0 14px;line-height:1.5;">' + post.Post + '</p>' : '')
      + (reportBtn || deleteBtn ? '<div style="display:flex;gap:8px;">' + reportBtn + deleteBtn + '</div>' : '')
      + '</div>'
      + '</div>';
  }).join('');

  postsContainer.insertAdjacentHTML('beforeend', newPosts);

  if (data.length < POSTS_PER_LOAD) {
    sfPlayerDone = true;
    var loader = document.getElementById('sf-player-loader');
    var endMsg = document.getElementById('sf-player-end');
    if (loader) loader.style.display = 'none';
    if (endMsg) endMsg.style.display = 'block';
  }

  sfPlayerPage++;
  sfPlayerLoading = false;
};



// ========================================
// BADGES EARNED (Player-specific)
// ========================================
var badgesEarnedPlayerTargetId = null;

window.addEventListener('load', function() {
  if (!document.getElementById('badges-earned-player-container')) return;

  var urlParams = new URLSearchParams(window.location.search);
  badgesEarnedPlayerTargetId = urlParams.get('player_profile_number');
  if (!badgesEarnedPlayerTargetId && window.location.pathname === '/profile') return; // handled by personal profile loader

  if (!badgesEarnedPlayerTargetId) {
    var personalDiv = document.getElementById('personal-player-number');
    if (personalDiv) {
      badgesEarnedPlayerTargetId = (personalDiv.innerText || personalDiv.textContent || '').trim();
    }
  }

  if (!badgesEarnedPlayerTargetId) {
    document.getElementById('badges-earned-player-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No player specified.</p>';
    return;
  }

  window.loadBadgesEarnedPlayer();
});

window.loadBadgesEarnedPlayer = async function() {
  var container = document.getElementById('badges-earned-player-container');
  if (!container) return;

  var allBadgesResult = await window._supabase
    .from('Badges')
    .select('"Name", "Notes", "URL", "Badge Image URL", "Season", "Start Date", "End Date", "Badge #"')
    .order('"Badge #"', { ascending: true });

  var allBadges = allBadgesResult.data || [];

  var earnedResult = await window._supabase
    .from('Player Badges')
    .select('"Badge", "Date"')
    .eq('player_id', badgesEarnedPlayerTargetId);

  var earnedBadges = earnedResult.data || [];
  var earnedMap = {};
  earnedBadges.forEach(function(eb) {
    earnedMap[eb.Badge] = eb.Date;
  });

  var earnedCount = earnedBadges.length;
  var totalCount = allBadges.length;

  var items = allBadges.map(function(b) {
    var isEarned = earnedMap.hasOwnProperty(b.Name);
    var earnedDate = earnedMap[b.Name];

    var imageStyle = isEarned
      ? 'width:64px;height:64px;object-fit:contain;border-radius:8px;background:#f5f5f5;'
      : 'width:64px;height:64px;object-fit:contain;border-radius:8px;background:#f5f5f5;filter:grayscale(100%);opacity:0.4;';

    var statusBadge = isEarned
      ? '<span style="padding:3px 10px;background:#e6f4ea;color:#2d7a3a;border-radius:12px;font-size:11px;font-weight:500;">✓ Earned</span>'
      : '<span style="padding:3px 10px;background:#f5f5f5;color:#888;border-radius:12px;font-size:11px;">Locked</span>';

    var nameColor = isEarned ? '#111' : '#888';
    var dateText = isEarned
      ? '<p style="font-size:12px;color:#2d7a3a;margin:0;">Earned ' + (earnedDate ? new Date(earnedDate).toLocaleDateString() : '') + '</p>'
      : '<p style="font-size:12px;color:#888;margin:0;">Not yet earned</p>';

    return '<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border-bottom:1px solid #f0f0f0;">'
      + '<img src="' + (b['Badge Image URL'] || '') + '" alt="' + b.Name + '" style="' + imageStyle + 'flex-shrink:0;" />'
      + '<div style="flex:1;">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">'
      + '<p style="font-size:15px;font-weight:500;color:' + nameColor + ';margin:0;">' + b.Name + '</p>'
      + statusBadge
      + '</div>'
      + '<p style="font-size:13px;color:#555;margin:0 0 6px;">' + (b.Notes || '') + '</p>'
      + dateText
      + '</div>'
      + '</div>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">'
    + '<h2 style="font-size:22px;font-weight:500;color:#111;margin:0;">Badges</h2>'
    + '<span style="font-size:14px;color:#888;">' + earnedCount + ' / ' + totalCount + ' earned</span>'
    + '</div>'
    + '<div style="background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">'
    + (items || '<p style="padding:2rem;text-align:center;color:#888;">No badges available</p>')
    + '</div>'
    + '</div>';
};



// ========================================
// FRIENDS LEADERBOARD
// ========================================
window.addEventListener('load', async function() {
  if (!document.getElementById('friends-leaderboard-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.loadFriendsLeaderboard();
});

window.loadFriendsLeaderboard = async function() {
  var container = document.getElementById('friends-leaderboard-container');
  if (!container) return;

  if (!currentPlayerProfileNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">You must be logged in to view your friends leaderboard.</p>';
    return;
  }

  var friendshipsResult = await window._supabase
    .from('Friendships')
    .select('*')
    .or('player_1_id.eq.' + currentPlayerProfileNumber + ',player_2_id.eq.' + currentPlayerProfileNumber);

  var friendships = friendshipsResult.data || [];
  var friendIds = friendships.map(function(f) {
    return f.player_1_id == currentPlayerProfileNumber ? f.player_2_id : f.player_1_id;
  });

  var playerIds = friendIds.concat([currentPlayerProfileNumber]);

  var playersResult = await window._supabase
    .from('Players')
    .select('"player_id", "Username", "Tier", "XP", "State/Province", "Country"')
    .in('player_id', playerIds)
    .eq('status', 'active')
    .order('"XP"', { ascending: false });

  var players = playersResult.data || [];

  if (players.length === 0) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No friends yet. Add friends to see them here.</p>';
    return;
  }

  var rows = players.map(function(p, i) {
    var isMe = p.player_id == currentPlayerProfileNumber;
    var rowStyle = isMe
      ? 'border-bottom:1px solid #f5f5f5;background:#e6f1fb;'
      : 'border-bottom:1px solid #f5f5f5;';
    var nameLabel = isMe
      ? (p.Username || 'You') + ' <span style="font-size:11px;color:#378add;font-weight:500;margin-left:4px;">(You)</span>'
      : (p.Username || 'N/A');

    return '<tr style="' + rowStyle + '">'
      + '<td style="padding:12px 14px;color:#888;">' + (i + 1) + '</td>'
      + '<td style="padding:12px 14px;color:#111;">' + nameLabel + '</td>'
      + '<td style="padding:12px 14px;"><span style="padding:2px 10px;background:#f5f5f5;color:#555;border-radius:4px;font-size:12px;">' + (p.Tier || 'N/A') + '</span></td>'
      + '<td style="padding:12px 14px;color:#111;font-weight:500;">' + (p.XP || 0) + '</td>'
      + '<td style="padding:12px 14px;color:#555;">' + (p['State/Province'] || 'N/A') + '</td>'
      + '<td style="padding:12px 14px;color:#555;">' + (p.Country || 'N/A') + '</td>'
      + '</tr>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Friends Leaderboard</h2>'
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">'
    + '<table style="min-width:600px;width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:1px solid #eee;">'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;"># Rank</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Username</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Tier</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">XP</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">State/Province</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Country</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';
};



// ========================================
// GROUP LEADERBOARD
// ========================================
function tryInitGroupLeaderboard(attempts) {
  attempts = attempts || 0;
  var el = document.getElementById('group-leaderboard-container');
  if (el) {
    window.initGroupLeaderboard();
  } else if (attempts < 10) {
    setTimeout(function() { tryInitGroupLeaderboard(attempts + 1); }, 300);
  }
}

window.addEventListener('load', function() {
  if (window.location.pathname === '/group-search') {
    tryInitGroupLeaderboard();
  }
});

window.initGroupLeaderboard = function() {
  var container = document.getElementById('group-leaderboard-container');
  if (!container) return;

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:800px;margin:0 auto;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:8px;color:#111;">Groups</h2>'
    + '<p style="font-size:13px;color:#888;margin-bottom:1rem;">Browse all groups and click one to see details.</p>'
    + '<input id="gl-search" type="text" placeholder="Search groups..." oninput="renderGroupLeaderboard()" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:1rem;color:#111;box-sizing:border-box;" />'
    + '<div id="gl-list" style="display:flex;flex-direction:column;gap:10px;"><p style="padding:2rem;text-align:center;color:#888;">Loading...</p></div>'
    + '</div>';

  window.loadGroupLeaderboardData();
};

window.groupLeaderboardData = [];

window.loadGroupLeaderboardData = async function() {
  var groupsResult = await window._supabase
    .from('Groups')
    .select('"id", "group_number", "group_name", "description", "created_by", "group_page_url"')
    .order('"group_number"', { ascending: true });

  var groups = groupsResult.data || [];

  if (groups.length === 0) {
    document.getElementById('gl-list').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No groups exist yet.</p>';
    return;
  }

  var membersResult = await window._supabase
    .from('Group Members')
    .select('group_id');

  var memberCounts = {};
  (membersResult.data || []).forEach(function(m) {
    memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
  });

  var creatorIds = [...new Set(groups.map(function(g) { return g.created_by; }).filter(Boolean))];
  var creatorMap = {};
  if (creatorIds.length > 0) {
    var creatorsResult = await window._supabase
      .from('Players')
      .select('"player_id", "Username"')
      .in('player_id', creatorIds);
    (creatorsResult.data || []).forEach(function(p) { creatorMap[p.player_id] = p.Username; });
  }

  window.groupLeaderboardData = groups.map(function(g) {
    return {
      id: g.id,
      groupNumber: g.group_number,
      groupName: g.group_name,
      description: g.description,
      creatorName: creatorMap[g.created_by] || 'Unknown',
      memberCount: memberCounts[g.id] || 0,
      profileUrl: '/group-profiles?group_number=' + g.group_number
    };
  });

  window.renderGroupLeaderboard();
};

window.renderGroupLeaderboard = function() {
  var list = document.getElementById('gl-list');
  if (!list) return;

  var searchInput = document.getElementById('gl-search');
  var search = searchInput ? searchInput.value.toLowerCase() : '';

  var filtered = window.groupLeaderboardData;
  if (search) {
    filtered = filtered.filter(function(g) {
      return (g.groupName || '').toLowerCase().includes(search)
        || (g.creatorName || '').toLowerCase().includes(search);
    });
  }

  if (filtered.length === 0) {
    list.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No groups found.</p>';
    return;
  }

  list.innerHTML = filtered.map(function(g) {
    return '<a href="' + g.profileUrl + '" style="display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid #eee;border-radius:10px;background:#fff;text-decoration:none;color:#111;">'
      + '<div style="width:48px;height:48px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#555;font-size:15px;font-weight:500;flex-shrink:0;">' + (g.groupName ? g.groupName.charAt(0).toUpperCase() : '?') + '</div>'
      + '<div style="flex:1;min-width:0;">'
      + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 2px;">' + (g.groupName || 'Unnamed Group') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0;">' + g.memberCount + ' member' + (g.memberCount === 1 ? '' : 's') + ' · Created by ' + g.creatorName + '</p>'
      + '</div>'
      + '<span style="color:#888;font-size:18px;">›</span>'
      + '</a>';
  }).join('');
};



// ========================================
// GROUP PLAYER LEADERBOARD
// ========================================
window.addEventListener('load', async function() {
  if (!document.getElementById('group-player-leaderboard-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.loadGroupPlayerLeaderboard();
});

window.loadGroupPlayerLeaderboard = async function() {
  var container = document.getElementById('group-player-leaderboard-container');
  if (!container) return;

  var urlParams = new URLSearchParams(window.location.search);
  var groupNumber = urlParams.get('group_number');

  if (!groupNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No group specified.</p>';
    return;
  }

  var groupResult = await window._supabase
    .from('Groups')
.select('"id", "group_name", "is_private"')
    .eq('group_number', groupNumber)
    .limit(1);

  if (!groupResult.data || groupResult.data.length === 0) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Group not found.</p>';
    return;
  }

var groupId = groupResult.data[0].id;
  var groupName = groupResult.data[0].group_name;
  var groupIsPrivate = groupResult.data[0].is_private;

  // Privacy gate
  if (groupIsPrivate) {
    var currentPlayer = await getCurrentPlayer();
    var memberCheck = await window._supabase
      .from('Group Members')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('player_id', currentPlayer.playerId)
      .limit(1);
    var isMember = memberCheck.data && memberCheck.data.length > 0;
    if (!isMember) {
      container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">🔒 This group is private.</p>';
      return;
    }
  }

  var membersResult = await window._supabase
    .from('Group Members')
    .select('player_id')
    .eq('group_id', groupId);

  var memberIds = (membersResult.data || []).map(function(m) { return m.player_id; });

  if (memberIds.length === 0) {
    container.innerHTML = ''
      + '<div style="padding:0 16px;">'
      + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">' + groupName + ' Leaderboard</h2>'
      + '<p style="color:#888;font-size:14px;">This group has no members yet.</p>'
      + '</div>';
    return;
  }

  var playersResult = await window._supabase
    .from('Players')
    .select('"player_id", "Username", "Tier", "XP", "State/Province", "Country"')
    .in('player_id', memberIds)
    .eq('status', 'active')
    .order('"XP"', { ascending: false });

  var players = playersResult.data || [];

  var rows = players.map(function(p, i) {
    var isMe = currentPlayerProfileNumber && p.player_id == currentPlayerProfileNumber;
    var rowStyle = isMe
      ? 'border-bottom:1px solid #f5f5f5;background:#e6f1fb;'
      : 'border-bottom:1px solid #f5f5f5;';
    var nameLabel = isMe
      ? (p.Username || 'You') + ' <span style="font-size:11px;color:#378add;font-weight:500;margin-left:4px;">(You)</span>'
      : (p.Username || 'N/A');

    return '<tr style="' + rowStyle + '">'
      + '<td style="padding:12px 14px;color:#888;">' + (i + 1) + '</td>'
      + '<td style="padding:12px 14px;color:#111;">' + nameLabel + '</td>'
      + '<td style="padding:12px 14px;"><span style="padding:2px 10px;background:#f5f5f5;color:#555;border-radius:4px;font-size:12px;">' + (p.Tier || 'N/A') + '</span></td>'
      + '<td style="padding:12px 14px;color:#111;font-weight:500;">' + (p.XP || 0) + '</td>'
      + '<td style="padding:12px 14px;color:#555;">' + (p['State/Province'] || 'N/A') + '</td>'
      + '<td style="padding:12px 14px;color:#555;">' + (p.Country || 'N/A') + '</td>'
      + '</tr>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">' + groupName + ' Leaderboard</h2>'
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">'
    + '<table style="min-width:600px;width:100%;border-collapse:collapse;font-size:13px;">'
    + '<thead><tr style="border-bottom:1px solid #eee;">'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;"># Rank</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Username</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Tier</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">XP</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">State/Province</th>'
    + '<th style="text-align:left;padding:10px 14px;color:#888;font-weight:500;">Country</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';
};



// ========================================
// SF GROUP (Group social feed)
// ========================================
var sfGroupMemberIds = [];
var SF_GROUP_LIMIT = 5;

window.addEventListener('load', async function() {
  if (!document.getElementById('sf-group-container')) return;

  var urlParams = new URLSearchParams(window.location.search);
  var groupNumber = urlParams.get('group_number');

  if (!groupNumber) {
    document.getElementById('sf-group-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">No group specified.</p>';
    return;
  }

  var groupResult = await window._supabase
    .from('Groups')
    .select('"id", "is_private"')
    .eq('group_number', groupNumber)
    .limit(1);

  if (!groupResult.data || groupResult.data.length === 0) {
    document.getElementById('sf-group-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Group not found.</p>';
    return;
  }

  var groupId = groupResult.data[0].id;
  var groupIsPrivate = groupResult.data[0].is_private;

  // Privacy gate
  if (groupIsPrivate) {
    var currentPlayer = await getCurrentPlayer();
    var memberCheck = await window._supabase
      .from('Group Members')
      .select('player_id')
      .eq('group_id', groupId)
      .eq('player_id', currentPlayer.playerId)
      .limit(1);
    var isMember = memberCheck.data && memberCheck.data.length > 0;
    if (!isMember) {
      document.getElementById('sf-group-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">🔒 This group is private.</p>';
      return;
    }
  }

  var membersResult = await window._supabase
    .from('Group Members')
    .select('player_id')
    .eq('group_id', groupId);

  sfGroupMemberIds = (membersResult.data || []).map(function(m) { return m.player_id; });

  window.loadSFGroup(groupNumber);
});

window.loadSFGroup = async function(groupNumber) {
  var container = document.getElementById('sf-group-container');
  if (!container) return;

  if (sfGroupMemberIds.length === 0) {
    container.innerHTML = ''
      + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
      + '<h2 style="font-size:20px;font-weight:500;margin-bottom:1.25rem;color:#111;">Group Feed</h2>'
      + '<p style="color:#888;font-size:14px;">This group has no members yet.</p>'
      + '</div>';
    return;
  }

  var result = await window._supabase
    .from('Social Feed')
    .select('"Feed Posts", "Post", "Attachments", "Players", "Court Name", "Date", "player_id"')
    .in('player_id', sfGroupMemberIds)
    .order('"Date"', { ascending: false })
    .limit(SF_GROUP_LIMIT);

  var data = result.data;
  var error = result.error;

  if (error) { console.error(error); return; }

  if (!data || data.length === 0) {
    container.innerHTML = ''
      + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
      + '<h2 style="font-size:20px;font-weight:500;margin-bottom:1.25rem;color:#111;">Group Feed</h2>'
      + '<p style="color:#888;font-size:14px;">This group has no posts yet.</p>'
      + '</div>';
    return;
  }

  var countResult = await window._supabase
    .from('Social Feed')
    .select('"Feed Posts"', { count: 'exact', head: true })
    .in('player_id', sfGroupMemberIds);

  var totalPosts = countResult.count || data.length;
  var hasMore = totalPosts > SF_GROUP_LIMIT;

  var posts = data.map(function(post) {
    return '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;background:#fff;">'
      + '<div style="position:relative;">'
      + '<img src="' + (post.Attachments || '') + '" style="width:100%;max-height:500px;object-fit:cover;display:block;" />'
      + '<span style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;padding:5px 12px;border-radius:20px;font-weight:500;">' + (post.Players || '') + '</span>'
      + '</div>'
      + '<div style="padding:16px 18px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">'
      + '<span style="font-size:12px;color:#888;">' + (post.Date ? formatPostTime(post.Date) : 'N/A') + '</span>'
      + '<span style="font-size:12px;color:#888;">' + (post['Court Name'] || 'N/A') + '</span>'
      + '</div>'
      + (post.Post ? '<p style="font-size:15px;color:#111;margin:0;line-height:1.5;">' + post.Post + '</p>' : '')
      + '</div>'
      + '</div>';
  }).join('');

  var viewAllBtn = hasMore
    ? '<a href="/group-feed?group_number=' + groupNumber + '" style="display:block;text-align:center;padding:12px 16px;background:#fff;color:#378add;border:1px solid #ddd;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;margin-top:16px;">View All Posts →</a>'
    : '';

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:20px;font-weight:500;margin-bottom:1.25rem;color:#111;">Group Feed</h2>'
    + '<div style="display:flex;flex-direction:column;gap:20px;">' + posts + '</div>'
    + viewAllBtn
    + '</div>';
};



// ========================================
// SIGNUP
// ========================================
window.addEventListener('load', function() {
  if (document.getElementById('signup-container')) {
    window.initSignup();
  }
});

window.initSignup = function() {
  var container = document.getElementById('signup-container');
  if (!container) return;

  var countries = ["United States","Canada","Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Samoa","San Marino","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

  var states = ["N/A","Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Northwest Territories","Nova Scotia","Nunavut","Ontario","Prince Edward Island","Quebec","Saskatchewan","Yukon"];

  var countryOptions = countries.map(function(c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
  var stateOptions = states.map(function(s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:440px;margin:0 auto;">'
    + '<h2 style="font-size:24px;font-weight:500;margin-bottom:8px;color:#111;">Create Your Account</h2>'
    + '<p style="font-size:14px;color:#888;margin-bottom:1.5rem;">Join the community of verified hoopers.</p>'
    + '<div id="signup-form">'
    + '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Email</label>'
    + '<input id="signup-email" type="email" placeholder="you@example.com" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:14px;color:#111;box-sizing:border-box;" />'
    + '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Password</label>'
    + '<input id="signup-password" type="password" placeholder="At least 8 characters" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:14px;color:#111;box-sizing:border-box;" />'
    + '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">Country</label>'
    + '<select id="signup-country" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:14px;color:#111;background:#fff;box-sizing:border-box;">'
    + '<option value="">Select your country</option>'
    + countryOptions
    + '</select>'
    + '<label style="display:block;font-size:13px;color:#555;margin-bottom:6px;">State/Province (optional)</label>'
    + '<select id="signup-state" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;margin-bottom:14px;color:#111;background:#fff;box-sizing:border-box;">'
    + '<option value="">Select your state or province</option>'
    + stateOptions
    + '</select>'
    + '<label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#555;margin-bottom:20px;cursor:pointer;">'
    + '<input id="signup-terms" type="checkbox" style="width:16px;height:16px;" />'
    + '<span>I agree to the <a href="/terms-and-conditions" target="_blank" style="color:#378add;">Terms and Conditions</a></span>'
    + '</label>'
    + '<button id="signup-submit" onclick="submitSignup()" style="width:100%;padding:12px 20px;background:#378add;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">Create Account</button>'
    + '<div id="signup-message" style="font-size:13px;margin-top:12px;min-height:20px;"></div>'
    + '<p style="font-size:13px;color:#555;text-align:center;margin-top:16px;">Already have an account? <a href="/sign-in" style="color:#378add;">Log in</a></p>'
    + '</div>'
    + '</div>';
};

window.submitSignup = async function() {
  var email = document.getElementById('signup-email').value.trim();
  var password = document.getElementById('signup-password').value;
  var country = document.getElementById('signup-country').value;
  var state = document.getElementById('signup-state').value;
  var termsAgreed = document.getElementById('signup-terms').checked;
  var messageEl = document.getElementById('signup-message');
  var btn = document.getElementById('signup-submit');

  messageEl.innerHTML = '';

  if (!email || !password) {
    messageEl.innerHTML = '<span style="color:#e24b4a;">Email and password are required.</span>';
    return;
  }

  if (password.length < 8) {
    messageEl.innerHTML = '<span style="color:#e24b4a;">Password must be at least 8 characters.</span>';
    return;
  }

  if (!country) {
    messageEl.innerHTML = '<span style="color:#e24b4a;">Please select a country.</span>';
    return;
  }

  if (!termsAgreed) {
    messageEl.innerHTML = '<span style="color:#e24b4a;">You must agree to the Terms and Conditions.</span>';
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Creating account...';

  var signUpResult = await window._supabase.auth.signUp({
    email: email,
    password: password
  });

  if (signUpResult.error) {
    console.error(signUpResult.error);
    messageEl.innerHTML = '<span style="color:#e24b4a;">' + signUpResult.error.message + '</span>';
    btn.disabled = false;
    btn.innerText = 'Create Account';
    return;
  }

  var authUserId = signUpResult.data.user.id;

  var playerInsert = await window._supabase
    .from('Players')
    .insert({
      auth_user_id: authUserId,
      Email: email,
      Country: country,
      'State/Province': state || null,
      XP: 0,
Tier: 'Bronze'
    })
    .select();

  if (playerInsert.error) {
    console.error(playerInsert.error);
    messageEl.innerHTML = '<span style="color:#e24b4a;">Account created but profile setup failed. Contact support.</span>';
    btn.disabled = false;
    btn.innerText = 'Create Account';
    return;
  }

messageEl.innerHTML = '<span style="color:#2d7a3a;">Account created! Check your email to confirm your address.</span>';

setTimeout(function() {
  window.location.href = '/confirm-email';
}, 1500);
};



// ========================================
// SHARED CONFIG
// ========================================
const BYTESCALE_API_KEY = "public_G22nhnC83CH88avhAZxjkQq4tdkn";
const AUTH_LINK_COLUMN = "auth_user_id";

async function requireAuth() {
  const { data: { user } } = await window._supabase.auth.getUser();
  if (!user) {
    window.location.href = "/sign-in";
    return null;
  }
  return user;
}



// ========================================
// /username-setup
// ========================================
async function initUsernameSetup() {
  const container = document.getElementById("username-setup-container");
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Pick your username</h2>
      <p class="pop-sub">This is how other players will find and tag you. Minimum 6 characters.</p>
      <input type="text" id="username-input" class="pop-input" placeholder="Username" autocomplete="off" />
      <div id="username-feedback" class="pop-feedback"></div>
      <button id="submit-username-btn" class="pop-btn" disabled>Continue</button>
    </div>
  `;
  injectPopStyles();

  const input = document.getElementById("username-input");
  const feedback = document.getElementById("username-feedback");
  const submitBtn = document.getElementById("submit-username-btn");

  let debounceTimer;
  let isAvailable = false;

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const value = input.value.trim();
    isAvailable = false;
    submitBtn.disabled = true;

    if (value.length < 6) {
      feedback.textContent = "Must be at least 6 characters.";
      feedback.style.color = "#888";
      return;
    }

    feedback.textContent = "Checking...";
    feedback.style.color = "#888";

    debounceTimer = setTimeout(async () => {
      const { data, error } = await window._supabase
        .from("Players")
        .select("player_id")
        .ilike("Username", value)
        .limit(1);

      if (error) { feedback.textContent = "Error checking username."; return; }

      if (data && data.length > 0) {
        feedback.textContent = "Username taken.";
        feedback.style.color = "#c00";
      } else {
        feedback.textContent = "Available!";
        feedback.style.color = "#0a0";
        isAvailable = true;
        submitBtn.disabled = false;
      }
    }, 400);
  });

  submitBtn.addEventListener("click", async function () {
    if (!isAvailable) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const { error } = await window._supabase
      .from("Players")
      .update({ "Username": input.value.trim() })
      .eq(AUTH_LINK_COLUMN, user.id);

    if (error) {
      feedback.textContent = "Error saving. Try again.";
      feedback.style.color = "#c00";
      submitBtn.disabled = false;
      submitBtn.textContent = "Continue";
      console.error(error);
      return;
    }

    window.location.href = "/profile-setup";
  });
}



// ========================================
// /change-username
// ========================================
async function initChangeUsername() {
  const container = document.getElementById("change-username-container");
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  const { data: currentPlayer } = await window._supabase
    .from("Players")
    .select("Username")
    .eq(AUTH_LINK_COLUMN, user.id)
    .single();

  const currentText = currentPlayer && currentPlayer.Username
    ? "Current: @" + currentPlayer.Username
    : "";

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Change your username</h2>
      <div id="current-username" class="pop-current">${currentText}</div>
      <input type="text" id="username-input" class="pop-input" placeholder="New username" autocomplete="off" />
      <div id="username-feedback" class="pop-feedback"></div>
      <button id="submit-username-btn" class="pop-btn" disabled>Save</button>
    </div>
  `;
  injectPopStyles();

  const input = document.getElementById("username-input");
  const feedback = document.getElementById("username-feedback");
  const submitBtn = document.getElementById("submit-username-btn");

  let debounceTimer;
  let isAvailable = false;

  input.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const value = input.value.trim();
    isAvailable = false;
    submitBtn.disabled = true;

    if (value.length < 6) {
      feedback.textContent = "Must be at least 6 characters.";
      feedback.style.color = "#888";
      return;
    }

    if (currentPlayer && currentPlayer.Username
        && value.toLowerCase() === currentPlayer.Username.toLowerCase()) {
      feedback.textContent = "That's already your username.";
      feedback.style.color = "#888";
      return;
    }

    feedback.textContent = "Checking...";
    feedback.style.color = "#888";

    debounceTimer = setTimeout(async () => {
      const { data, error } = await window._supabase
        .from("Players")
        .select("player_id")
        .ilike("Username", value)
        .limit(1);

      if (error) { feedback.textContent = "Error checking username."; return; }

      if (data && data.length > 0) {
        feedback.textContent = "Username taken.";
        feedback.style.color = "#c00";
      } else {
        feedback.textContent = "Available!";
        feedback.style.color = "#0a0";
        isAvailable = true;
        submitBtn.disabled = false;
      }
    }, 400);
  });

  submitBtn.addEventListener("click", async function () {
    if (!isAvailable) return;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const { error } = await window._supabase
      .from("Players")
      .update({ "Username": input.value.trim() })
      .eq(AUTH_LINK_COLUMN, user.id);

    if (error) {
      feedback.textContent = "Error saving. Try again.";
      feedback.style.color = "#c00";
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
      console.error(error);
      return;
    }

    window.location.href = "/sp-home";
  });
}



// ========================================
// /profile-setup
// ========================================
async function initProfileSetup() {
  const container = document.getElementById("profile-setup-container");
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Set up your profile</h2>
      <p class="pop-sub">Required fields help us build your player card. You can edit anytime.</p>

      <label class="pop-label">Position <span class="pop-req">*</span></label>
      <select id="position-select" class="pop-input">
        <option value="">Select a position...</option>
        <option value="Point Guard">Point Guard</option>
        <option value="Shooting Guard">Shooting Guard</option>
        <option value="Small Forward">Small Forward</option>
        <option value="Power Forward">Power Forward</option>
        <option value="Center">Center</option>
      </select>

      <label class="pop-label">Top Skill <span class="pop-req">*</span></label>
      <select id="skill-select" class="pop-input">
        <option value="">Select your top skill...</option>
        <option value="Scoring">Scoring</option>
        <option value="Passing">Passing</option>
        <option value="Dribbling">Dribbling</option>
        <option value="Rebounding">Rebounding</option>
        <option value="Defending">Defending</option>
      </select>

      <label class="pop-label">Favorite Player</label>
      <input type="text" id="favorite-player-input" class="pop-input" placeholder="e.g. Kobe Bryant" />

      <label class="pop-label">Profile Photo</label>
      <button type="button" id="photo-upload-btn" class="pop-btn-secondary">Upload Photo</button>
      <img id="photo-preview" class="pop-preview" style="display:none;" alt="Profile preview" />
      <div id="photo-url-storage" style="display:none;"></div>

      <button id="submit-profile-btn" class="pop-btn">Finish</button>
    </div>
  `;
  injectPopStyles();

  window._supabase
  .from('Players')
  .select('"Position", "Top Skill", "Favorite Player", "Profile Photo URL"')
  .eq(AUTH_LINK_COLUMN, user.id)
  .single()
  .then(function(result) {
    if (!result.data) return;
    var d = result.data;
    if (d.Position) {
      var pos = document.getElementById('position-select');
      if (pos) pos.value = d.Position;
    }
    if (d['Top Skill']) {
      var skill = document.getElementById('skill-select');
      if (skill) skill.value = d['Top Skill'];
    }
    if (d['Favorite Player']) {
      var fav = document.getElementById('favorite-player-input');
      if (fav) fav.value = d['Favorite Player'];
    }
    if (d['Profile Photo URL']) {
      var preview = document.getElementById('photo-preview');
      var storage = document.getElementById('photo-url-storage');
      var btn = document.getElementById('photo-upload-btn');
      if (preview) { preview.src = d['Profile Photo URL']; preview.style.display = 'block'; }
      if (storage) storage.textContent = d['Profile Photo URL'];
      if (btn) btn.textContent = 'Change Photo';
    }
  });

  const positionSelect = document.getElementById("position-select");
  const skillSelect = document.getElementById("skill-select");
  const favPlayerInput = document.getElementById("favorite-player-input");
  const photoBtn = document.getElementById("photo-upload-btn");
  const photoPreview = document.getElementById("photo-preview");
  const photoStorage = document.getElementById("photo-url-storage");
  const submitBtn = document.getElementById("submit-profile-btn");

  photoBtn.addEventListener("click", function () {
    const uploader = window.UploadWidget || (window.Bytescale && window.Bytescale.UploadWidget);
    if (!uploader) { alert("Upload widget failed to load."); return; }

    uploader.open({
      apiKey: BYTESCALE_API_KEY,
      maxFileCount: 1,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      editor: { images: { crop: true, cropShape: "circ", cropRatio: 1 } }
    }).then(files => {
      if (!files.length) return;
      const url = files[0].fileUrl;
      photoStorage.textContent = url;
      photoPreview.src = url;
      photoPreview.style.display = "block";
      photoBtn.textContent = "Change Photo";
    }).catch(err => console.error("Upload error:", err));
  });

  submitBtn.addEventListener("click", async function () {
    const position = positionSelect.value;
    const skill = skillSelect.value;
    const favPlayer = favPlayerInput.value.trim();
    const photoUrl = photoStorage.textContent.trim();

    if (!position || !skill) {
      alert("Please select a Position and Top Skill.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const updateData = {
      "Position": position,
      "Top Skill": skill
    };
    if (favPlayer) updateData["Favorite Player"] = favPlayer;
    if (photoUrl) updateData["Profile Photo URL"] = photoUrl;

    const { error } = await window._supabase
      .from("Players")
      .update(updateData)
      .eq(AUTH_LINK_COLUMN, user.id);

    if (error) {
      alert("Error saving profile. Try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Finish";
      console.error(error);
      return;
    }

    window.location.href = "/sp-home";
  });
}



// ========================================
// Shared onboarding styles
// ========================================
function injectPopStyles() {
  if (document.getElementById("pop-onboarding-styles")) return;
  const style = document.createElement("style");
  style.id = "pop-onboarding-styles";
  style.textContent = `
    .pop-form {
      max-width: 440px;
      margin: 40px auto;
      padding: 32px;
      font-family: inherit;
    }
    .pop-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .pop-sub {
      font-size: 14px;
      color: #666;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }
    .pop-current {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }
    .pop-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin: 16px 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pop-req { color: #c00; }
    .pop-input {
      width: 100%;
      padding: 12px 14px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-sizing: border-box;
      background: #fff;
      font-family: inherit;
    }
    .pop-input:focus {
      outline: none;
      border-color: #000;
    }
    .pop-feedback {
      min-height: 20px;
      font-size: 13px;
      margin: 8px 0 16px 0;
    }
    .pop-btn {
      width: 100%;
      padding: 14px;
      font-size: 16px;
      font-weight: 600;
background: #FF5000;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 16px;
    }
    .pop-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .pop-btn-secondary {
      padding: 10px 16px;
      font-size: 14px;
      background: #f2f2f2;
      color: #000;
      border: 1px solid #ddd;
      border-radius: 8px;
      cursor: pointer;
    }
    .pop-preview {
      display: block;
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 50%;
      margin: 16px 0;
    }
  `;
  document.head.appendChild(style);
}



// ========================================
// /sign-in
// ========================================
async function initLogin() {
  const container = document.getElementById("login-container");
  if (!container) return;

// Detect if user just confirmed their email (Supabase puts token_type=signup in hash)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  const isJustConfirmed = hashParams.get('type') === 'signup' || 
                          new URLSearchParams(window.location.search).get('confirmed') === 'true';

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Welcome back</h2>
      ${isJustConfirmed ? `<div style="background:#e6f4ea;border:1px solid #2d7a3a;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:14px;color:#2d7a3a;">✓ Email confirmed! Sign in to get started.</div>` : ''}
      <input type="email" id="login-email" class="pop-input" placeholder="Email" />
      <input type="password" id="login-password" class="pop-input" style="margin-top:12px;" placeholder="Password" />
      <div id="login-feedback" class="pop-feedback"></div>
      <button id="login-btn" class="pop-btn">Log In</button>
    </div>
  `;
  injectPopStyles();

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");
  const feedback = document.getElementById("login-feedback");
  const loginBtn = document.getElementById("login-btn");

  loginBtn.addEventListener("click", async function () {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      feedback.textContent = "Please enter your email and password.";
      feedback.style.color = "#c00";
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    const { error } = await window._supabase.auth.signInWithPassword({ email, password });

    if (error) {
      feedback.textContent = "Invalid email or password.";
      feedback.style.color = "#c00";
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
      return;
    }

// Check onboarding state before redirecting
    const { data: { session } } = await window._supabase.auth.getSession();
    const { data: player } = await window._supabase
      .from('Players')
      .select('"Username", "Position"')
      .eq('auth_user_id', session.user.id)
      .single();

    if (!player || !player.Username) {
      window.location.href = '/username-setup';
    } else if (!player.Position) {
      window.location.href = '/profile-setup';
    } else {
      window.location.href = '/sp-home';
    }
  });
}

async function initForgotPassword() {
  const container = document.getElementById("forgot-password-container");
  if (!container) return;

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Reset your password</h2>
      <p class="pop-sub">Enter your email and we'll send you a reset link.</p>
      <input type="email" id="reset-email" class="pop-input" placeholder="you@example.com" />
      <div id="reset-feedback" class="pop-feedback"></div>
      <button id="send-reset-btn" class="pop-btn">Send Reset Link</button>
      <p style="font-size:13px;color:#555;text-align:center;margin-top:16px;">
        <a href="/sign-in" style="color:#378add;">Back to log in</a>
      </p>
    </div>
  `;
  injectPopStyles();

  const emailInput = document.getElementById("reset-email");
  const feedback = document.getElementById("reset-feedback");
  const sendBtn = document.getElementById("send-reset-btn");

  sendBtn.addEventListener("click", async function () {
    const email = emailInput.value.trim();

    if (!email) {
      feedback.textContent = "Please enter your email.";
      feedback.style.color = "#c00";
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    const { error } = await window._supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://swishpass.webflow.io/change-password"
    });

    if (error) {
      feedback.textContent = error.message;
      feedback.style.color = "#c00";
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Reset Link";
      return;
    }

    feedback.textContent = "Check your email for a reset link.";
    feedback.style.color = "#2d7a3a";
    sendBtn.textContent = "Sent";
  });
}

async function initChangePassword() {
  const container = document.getElementById("change-password-container");
  if (!container) return;

  const user = await requireAuth();
  if (!user) return;

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Change your password</h2>
      <label class="pop-label">New Password</label>
      <input type="password" id="new-password" class="pop-input" placeholder="At least 8 characters" />
      <label class="pop-label">Confirm New Password</label>
      <input type="password" id="confirm-password" class="pop-input" placeholder="Repeat new password" />
      <div id="password-feedback" class="pop-feedback"></div>
      <button id="save-password-btn" class="pop-btn">Save Password</button>
    </div>
  `;
  injectPopStyles();

  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const feedback = document.getElementById("password-feedback");
  const saveBtn = document.getElementById("save-password-btn");

  saveBtn.addEventListener("click", async function () {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    feedback.style.color = "#c00";

    if (!newPassword || !confirmPassword) {
      feedback.textContent = "Please fill in both fields.";
      return;
    }
    if (newPassword.length < 8) {
      feedback.textContent = "Password must be at least 8 characters.";
      return;
    }
    if (newPassword !== confirmPassword) {
      feedback.textContent = "Passwords don't match.";
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const { error } = await window._supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      feedback.textContent = error.message;
      feedback.style.color = "#c00";
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Password";
      return;
    }

    feedback.textContent = "Password updated successfully.";
    feedback.style.color = "#2d7a3a";
    saveBtn.textContent = "Saved";
  });
}

// ============================================================
// GROUPS — Shared helper
// ============================================================

async function getGroupNumberFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('group_number');
}

async function getGroupByNumber(groupNumber) {
  const { data, error } = await window._supabase
    .from('Groups')
    .select('*')
    .eq('group_number', groupNumber)
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0];
}

// ============================================================
// CREATE GROUP — runs on /create-group
// ============================================================

async function initCreateGroup() {
  const wrapper = document.querySelector('[data-group="create-form-wrapper"]');
  const form = document.querySelector('[data-group="create-form"]');
  if (!wrapper || !form) return;

  const player = await getCurrentPlayer();
  if (!player.playerId) {
    wrapper.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">You must be logged in to create a group.</p>';
    return;
  }

  wrapper.innerHTML = `
    <div style="max-width:480px;margin:40px auto;padding:32px;font-family:inherit;">
      <h2 style="font-size:28px;font-weight:700;margin:0 0 8px;color:#111;">Create a Group</h2>
      <p style="font-size:14px;color:#888;margin:0 0 24px;line-height:1.5;">Build your crew. Public groups are open to anyone — private groups are invite only.</p>

      <label style="display:block;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;color:#555;">Group Name <span style="color:#c00;">*</span></label>
      <input
        data-group="name"
        type="text"
        placeholder="e.g. Sunset Ballers"
        maxlength="60"
        style="width:100%;padding:12px 14px;font-size:15px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;color:#111;font-family:inherit;margin-bottom:16px;"
      />

      <label style="display:block;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px;color:#555;">Description</label>
      <textarea
        data-group="description"
        placeholder="What's this group about?"
        rows="3"
        style="width:100%;padding:12px 14px;font-size:15px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;color:#111;font-family:inherit;resize:vertical;margin-bottom:16px;"
      ></textarea>

      <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:14px 16px;border:1px solid #ddd;border-radius:8px;margin-bottom:24px;background:#fafafa;">
        <input type="checkbox" data-group="is-private" style="width:16px;height:16px;accent-color:#378add;" />
        <div>
          <p style="font-size:14px;font-weight:500;color:#111;margin:0 0 2px;">Private Group</p>
          <p style="font-size:12px;color:#888;margin:0;">Only players you add can join</p>
        </div>
      </label>

      <p data-group="error" style="color:#e24b4a;font-size:13px;min-height:20px;margin:0 0 12px;"></p>

      <button
        data-group="submit"
        style="width:100%;padding:14px;font-size:16px;font-weight:600;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;"
      >Create Group</button>
    </div>
  `;

  const nameInput    = wrapper.querySelector('[data-group="name"]');
  const descInput    = wrapper.querySelector('[data-group="description"]');
  const privateCheck = wrapper.querySelector('[data-group="is-private"]');
  const errorEl      = wrapper.querySelector('[data-group="error"]');
  const submitBtn    = wrapper.querySelector('[data-group="submit"]');

  submitBtn.addEventListener('click', async () => {
    const groupName   = nameInput.value.trim();
    const description = descInput.value.trim();
    const isPrivate   = privateCheck.checked;

    errorEl.textContent = '';

    if (!groupName) {
      errorEl.textContent = 'Group name is required.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const { data: groupData, error: groupError } = await window._supabase
      .from('Groups')
      .insert([{ group_name: groupName, description: description || null, created_by: player.playerId, is_private: isPrivate }])
      .select()
      .single();

    if (groupError || !groupData) {
      errorEl.textContent = 'Failed to create group. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Group';
      return;
    }

    const { error: memberError } = await window._supabase
      .from('Group Members')
      .insert([{ group_id: groupData.id, player_id: player.playerId, role: 'owner' }]);

    if (memberError) {
      errorEl.textContent = 'Group created but failed to set ownership. Contact support.';
      return;
    }

    window.location.href = groupData.group_page_url;
  });
}
// ============================================================
// LOAD GROUP PROFILE — runs on /group-profiles
// ============================================================

async function loadGroupProfile() {
  const container = document.querySelector('[data-group="profile-container"]');
  if (!container) return;

  const groupNumber = await getGroupNumberFromURL();
  if (!groupNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Group not found.</p>';
    return;
  }

  const group = await getGroupByNumber(groupNumber);
  if (!group) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">This group does not exist.</p>';
    return;
  }

  const player = await getCurrentPlayer();

  const { data: members } = await window._supabase
    .from('Group Members')
    .select('player_id, role, joined_at')
    .eq('group_id', group.id);

  if (!members) return;

  const playerIds = members.map(m => m.player_id);
  const { data: players } = await window._supabase
    .from('Players')
    .select('player_id, Username, Ranking, "Profile Photo URL"')
    .in('player_id', playerIds);

  const playerMap = {};
  if (players) players.forEach(p => { playerMap[p.player_id] = p; });

  const myMembership = members.find(m => m.player_id === player.playerId);
  const isOwner  = myMembership && myMembership.role === 'owner';
  const isAdmin  = myMembership && myMembership.role === 'admin';
  const isMember = !!myMembership;
  const canManageRequests = isOwner || isAdmin;
  const canJoin  = !isMember && !group.is_private && player.playerId;
  const isLockedOut = group.is_private && !isMember;

  // Check if the current player has already requested to join
  let requestStatus = 'none'; // 'none' | 'pending' | 'declined'
  let existingRequestId = null;
  if (isLockedOut && player.playerId) {
    const { data: reqCheck } = await window._supabase
      .from('Group_Join_Requests')
      .select('id, status')
      .eq('group_id', group.id)
      .eq('player_id', player.playerId)
      .limit(1);
    if (reqCheck && reqCheck.length > 0) {
      requestStatus = reqCheck[0].status;
      existingRequestId = reqCheck[0].id;
    }
  }

  // Build members list HTML (only shown to members)
  const membersHTML = members.map(m => {
    const p = playerMap[m.player_id] || {};
    const isMe = m.player_id === player.playerId;
    const photo = p['Profile Photo URL']
      ? `<img src="${p['Profile Photo URL']}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
      : `<div style="width:40px;height:40px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;font-weight:500;flex-shrink:0;">${(p.Username || '?').charAt(0).toUpperCase()}</div>`;
    const roleBadge = m.role === 'owner'
      ? `<span style="padding:2px 8px;background:#e6f1fb;color:#378add;border-radius:4px;font-size:11px;font-weight:500;">Owner</span>`
      : `<span style="padding:2px 8px;background:#f5f5f5;color:#888;border-radius:4px;font-size:11px;">Member</span>`;
    const removeBtn = isOwner && !isMe
      ? `<button data-action="remove-member" data-player-id="${m.player_id}" style="padding:6px 12px;background:#fff;color:#e24b4a;border:1px solid #e24b4a;border-radius:6px;font-size:12px;cursor:pointer;margin-left:auto;">Remove</button>`
      : '';
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;">
        ${photo}
        <div style="flex:1;min-width:0;">
          <p style="font-size:14px;font-weight:500;color:#111;margin:0 0 2px;">${p.Username || 'Unknown'}${isMe ? ' <span style="font-size:11px;color:#378add;">(You)</span>' : ''}</p>
          <p style="font-size:12px;color:#888;margin:0;">Rank #${p.Ranking || 'N/A'}</p>
        </div>
        ${roleBadge}
        ${removeBtn}
      </div>
    `;
  }).join('');

  // Build the request to join button label
  const requestBtnLabel =
    requestStatus === 'pending'  ? 'Request Sent' :
    requestStatus === 'declined' ? 'Request Declined' :
    'Request to Join';
  const requestBtnDisabled = requestStatus === 'pending' || requestStatus === 'declined';
  const requestBtnStyle = requestBtnDisabled
    ? 'width:100%;padding:12px;font-size:15px;font-weight:600;background:#f5f5f5;color:#888;border:1px solid #ddd;border-radius:8px;cursor:not-allowed;margin-bottom:12px;'
    : 'width:100%;padding:12px;font-size:15px;font-weight:600;background:#378add;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-bottom:12px;';
  const requestNote =
    requestStatus === 'pending'  ? '<p style="font-size:13px;color:#888;text-align:center;margin:0 0 16px;">The group owner will review your request.</p>' :
    requestStatus === 'declined' ? '<p style="font-size:13px;color:#e24b4a;text-align:center;margin:0 0 16px;">Your request was not accepted.</p>' :
    '';

  // Locked state block (private + non-member)
  const lockedHTML = `
    <div style="text-align:center;padding:48px 24px 32px;">
      <div style="font-size:48px;margin-bottom:16px;">🔒</div>
      <h3 style="font-size:18px;font-weight:700;color:#111;margin:0 0 8px;">This group is private</h3>
      <p style="font-size:14px;color:#888;margin:0 0 24px;line-height:1.6;">Members, posts, and leaderboard are only visible to group members.</p>
      ${player.playerId ? `
        <button
          data-action="request-join"
          style="${requestBtnStyle}"
          ${requestBtnDisabled ? 'disabled' : ''}
        >${requestBtnLabel}</button>
        ${requestNote}
      ` : '<p style="font-size:14px;color:#888;">Sign in to request access.</p>'}
    </div>
  `;

  // Render full profile
  container.innerHTML = `
    <div style="padding:0 16px;max-width:640px;margin:0 auto;">

      <!-- Group Header -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:64px;height:64px;border-radius:14px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#555;flex-shrink:0;">
          ${(group.group_name || '?').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 4px;">${group.group_name || 'Unnamed Group'}</h1>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:12px;color:#888;">${members.length} member${members.length === 1 ? '' : 's'}</span>
            <span style="color:#ddd;">·</span>
            <span style="padding:2px 8px;background:${group.is_private ? '#f5f5f5' : '#e6f4ea'};color:${group.is_private ? '#888' : '#2d7a3a'};border-radius:4px;font-size:11px;font-weight:500;">${group.is_private ? '🔒 Private' : '🔓 Public'}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      ${group.description ? `<p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6;padding:14px 16px;background:#fafafa;border-radius:8px;border:1px solid #eee;">${group.description}</p>` : ''}

      <!-- Owner/Admin: Join requests panel -->
      ${canManageRequests && group.is_private ? `
        <div id="join-requests-panel" style="background:#fff;border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
          <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
            <h2 style="font-size:15px;font-weight:600;color:#111;margin:0;">📬 Join Requests</h2>
            <button data-action="load-requests" style="padding:6px 14px;background:#378add;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">View</button>
          </div>
          <div id="join-requests-list" style="display:none;"></div>
        </div>
      ` : ''}

      <!-- Locked state OR join button OR members -->
      ${isLockedOut ? lockedHTML : `
        ${canJoin ? `
          <button data-action="join-group" style="width:100%;padding:12px;font-size:15px;font-weight:600;background:#378add;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-bottom:24px;">
            Join Group
          </button>
        ` : ''}

        <!-- Members -->
        <div style="background:#fff;border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
          <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
            <h2 style="font-size:15px;font-weight:600;color:#111;margin:0;">Members</h2>
          </div>
          ${membersHTML || '<p style="padding:2rem;text-align:center;color:#888;font-size:14px;">No members yet.</p>'}
        </div>

        <!-- Add Member (owner only) -->
        ${isOwner ? `
          <div style="background:#fff;border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
            <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
              <h2 style="font-size:15px;font-weight:600;color:#111;margin:0;">Add a Player</h2>
            </div>
            <div style="padding:16px;">
              <input data-group="add-member-search" type="text" placeholder="Search by username..."
                style="width:100%;padding:10px 14px;font-size:14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;color:#111;font-family:inherit;" />
              <div data-group="add-member-results" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;"></div>
              <p data-group="add-member-error" style="color:#e24b4a;font-size:13px;margin:8px 0 0;min-height:16px;"></p>
            </div>
          </div>
        ` : ''}

        <!-- Transfer Ownership Panel -->
        <div data-group="transfer-ownership-panel" style="display:none;background:#fff;border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
          <div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
            <h2 style="font-size:15px;font-weight:600;color:#111;margin:0;">Transfer Ownership</h2>
            <p style="font-size:13px;color:#888;margin:4px 0 0;">Choose a new owner before you leave.</p>
          </div>
          <div style="padding:16px;">
            <select data-group="transfer-select" style="width:100%;padding:10px 14px;font-size:14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;color:#111;background:#fff;font-family:inherit;margin-bottom:12px;">
              <option value="">Select new owner...</option>
            </select>
            <button data-action="confirm-transfer" style="width:100%;padding:12px;font-size:14px;font-weight:600;background:#111;color:#fff;border:none;border-radius:8px;cursor:pointer;">
              Confirm Transfer &amp; Leave
            </button>
          </div>
        </div>

        <!-- Member/Owner actions -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${isMember && !isOwner ? `
            <button data-action="leave-group" style="flex:1;padding:12px;font-size:14px;font-weight:500;background:#fff;color:#e24b4a;border:1px solid #e24b4a;border-radius:8px;cursor:pointer;">
              Leave Group
            </button>
          ` : ''}
          ${isOwner ? `
            <button data-action="leave-group" style="flex:1;padding:12px;font-size:14px;font-weight:500;background:#fff;color:#e24b4a;border:1px solid #e24b4a;border-radius:8px;cursor:pointer;">
              Leave Group
            </button>
            <button data-action="delete-group" style="flex:1;padding:12px;font-size:14px;font-weight:500;background:#e24b4a;color:#fff;border:none;border-radius:8px;cursor:pointer;">
              Delete Group
            </button>
          ` : ''}
        </div>
      `}

    </div>
  `;

  // ── Wire up remove buttons ────────────────────────────────────────────────
  container.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetPlayerId = parseInt(btn.dataset.playerId);
      await removeMemberFromGroup(group.id, targetPlayerId, group.group_number);
    });
  });

  // ── Wire up join button (public groups) ───────────────────────────────────
  const joinBtn = container.querySelector('[data-action="join-group"]');
  if (joinBtn && canJoin) {
    joinBtn.addEventListener('click', async () => {
      joinBtn.disabled = true;
      joinBtn.textContent = 'Joining...';
      const { error } = await window._supabase
        .from('Group Members')
        .insert([{ group_id: group.id, player_id: player.playerId, role: 'member' }]);
      if (error) {
        alert('Failed to join group. Please try again.');
        joinBtn.disabled = false;
        joinBtn.textContent = 'Join Group';
      } else {
        window.location.reload();
      }
    });
  }

  // ── Wire up Request to Join button ────────────────────────────────────────
  const requestBtn = container.querySelector('[data-action="request-join"]');
  if (requestBtn && !requestBtnDisabled) {
    requestBtn.addEventListener('click', async () => {
      requestBtn.disabled = true;
      requestBtn.textContent = 'Sending...';
      const { data: newReq, error } = await window._supabase
        .from('Group_Join_Requests')
        .insert({ group_id: group.id, player_id: player.playerId, status: 'pending' })
        .select('id')
        .limit(1);
      if (error) {
        if (error.code === '23505') {
          // Already requested — just update the button
          requestBtn.textContent = 'Request Sent';
          requestBtn.style.background = '#f5f5f5';
          requestBtn.style.color = '#888';
          requestBtn.style.border = '1px solid #ddd';
          requestBtn.style.cursor = 'not-allowed';
        } else {
          alert('Could not send request. Please try again.');
          requestBtn.disabled = false;
          requestBtn.textContent = 'Request to Join';
        }
        return;
      }
      requestBtn.textContent = 'Request Sent';
      requestBtn.style.background = '#f5f5f5';
      requestBtn.style.color = '#888';
      requestBtn.style.border = '1px solid #ddd';
      requestBtn.style.cursor = 'not-allowed';
      const noteEl = requestBtn.nextElementSibling;
      if (noteEl) {
        noteEl.textContent = 'The group owner will review your request.';
        noteEl.style.color = '#888';
        noteEl.style.display = 'block';
      }
    });
  }

  // ── Wire up View Join Requests button (owner/admin) ───────────────────────
  const loadRequestsBtn = container.querySelector('[data-action="load-requests"]');
  const requestsList = document.getElementById('join-requests-list');
  if (loadRequestsBtn && requestsList) {
    loadRequestsBtn.addEventListener('click', async () => {
      loadRequestsBtn.textContent = 'Loading...';
      loadRequestsBtn.disabled = true;
      await renderJoinRequestsList(group.id, requestsList);
      requestsList.style.display = 'block';
      loadRequestsBtn.style.display = 'none';
    });
  }

  // ── Wire up add member search (owner only) ────────────────────────────────
  if (isOwner) initAddMember(group.id, members.map(m => m.player_id));

  // ── Wire up leave button ──────────────────────────────────────────────────
  const leaveBtn = container.querySelector('[data-action="leave-group"]');
  if (leaveBtn && isMember) {
    leaveBtn.addEventListener('click', () => leaveGroup(group, members, player.playerId));
  }

  // ── Wire up delete button ─────────────────────────────────────────────────
  const deleteBtn = container.querySelector('[data-action="delete-group"]');
  if (deleteBtn && isOwner) {
    deleteBtn.addEventListener('click', () => deleteGroup(group));
  }
}


async function renderJoinRequestsList(groupId, container) {
  const { data: reqData } = await window._supabase
    .from('Group_Join_Requests')
    .select('id, player_id, requested_at, status')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true });

  if (!reqData || reqData.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:#888;font-size:14px;text-align:center;">No pending join requests.</p>';
    return;
  }

  const pids = reqData.map(r => r.player_id);
  const { data: players } = await window._supabase
    .from('Players')
    .select('player_id, Username, Tier, "Profile Photo URL"')
    .in('player_id', pids);

  const pMap = {};
  (players || []).forEach(p => { pMap[p.player_id] = p; });

  container.innerHTML = reqData.map(req => {
    const p = pMap[req.player_id] || {};
    const photo = p['Profile Photo URL']
      ? `<img src="${p['Profile Photo URL']}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
      : `<div style="width:36px;height:36px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;color:#888;font-size:13px;font-weight:500;flex-shrink:0;">${(p.Username || '?').charAt(0).toUpperCase()}</div>`;
    return `
      <div id="req-row-${req.id}" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5;">
        ${photo}
        <div style="flex:1;min-width:0;">
          <p style="font-size:14px;font-weight:500;color:#111;margin:0 0 2px;">${p.Username || 'Unknown'}</p>
          <p style="font-size:12px;color:#888;margin:0;">${p.Tier || ''}</p>
        </div>
        <button onclick="handleAcceptRequest('${req.id}', ${req.player_id}, '${groupId}')"
          style="padding:6px 14px;background:#2d7a3a;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">
          Accept
        </button>
        <button onclick="handleDeclineRequest('${req.id}')"
          style="padding:6px 14px;background:#fff;color:#e24b4a;border:1px solid #e24b4a;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">
          Decline
        </button>
      </div>
    `;
  }).join('');
}

window.handleAcceptRequest = async function(requestId, playerId, groupId) {
  const row = document.getElementById('req-row-' + requestId);
  if (row) row.style.opacity = '0.5';

  const { error: insertErr } = await window._supabase
    .from('Group Members')
    .insert([{ group_id: groupId, player_id: playerId, role: 'member' }]);

  if (insertErr) {
    alert('Could not accept request. Try again.');
    if (row) row.style.opacity = '1';
    return;
  }

  await window._supabase.from('Group_Join_Requests').delete().eq('id', requestId);
  if (row) row.remove();
};

window.handleDeclineRequest = async function(requestId) {
  const row = document.getElementById('req-row-' + requestId);
  if (row) row.style.opacity = '0.5';
  await window._supabase.from('Group_Join_Requests').delete().eq('id', requestId);
  if (row) row.remove();
};
// ============================================================
// ADD MEMBER — search by username, owner only
// ============================================================

async function initAddMember(groupId, existingPlayerIds) {
  const searchInput = document.querySelector('[data-group="add-member-search"]');
  const resultsEl   = document.querySelector('[data-group="add-member-results"]');
  const errorEl     = document.querySelector('[data-group="add-member-error"]');
  if (!searchInput || !resultsEl) return;

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = searchInput.value.trim();
    if (query.length < 3) {
      resultsEl.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      const { data: players } = await window._supabase
        .from('Players')
        .select('player_id, Username')
        .ilike('Username', `%${query}%`)
        .limit(5);

      resultsEl.innerHTML = '';
      if (!players || players.length === 0) {
        resultsEl.innerHTML = '<p>No players found.</p>';
        return;
      }

      players.forEach(p => {
        const alreadyMember = existingPlayerIds.includes(p.player_id);
        const item = document.createElement('div');
        item.className = 'add-member-result-item';
        item.innerHTML = `
          <span>${p.Username}</span>
          <button 
            data-action="confirm-add" 
            data-player-id="${p.player_id}"
            data-username="${p.Username}"
            ${alreadyMember ? 'disabled' : ''}>
            ${alreadyMember ? 'Already a member' : 'Add'}
          </button>
        `;
        resultsEl.appendChild(item);
      });

      // Wire up add buttons
      resultsEl.querySelectorAll('[data-action="confirm-add"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const newPlayerId = parseInt(btn.dataset.playerId);
          const { error } = await window._supabase
            .from('Group Members')
            .insert([{ group_id: groupId, player_id: newPlayerId, role: 'member' }]);
          if (error) {
            if (errorEl) errorEl.textContent = 'Failed to add member.';
          } else {
            btn.textContent = 'Added ✓';
            btn.disabled = true;
            existingPlayerIds.push(newPlayerId);
          }
        });
      });

    }, 400);
  });
}

// ============================================================
// REMOVE MEMBER — owner only
// ============================================================

async function removeMemberFromGroup(groupId, targetPlayerId, groupNumber) {
  const confirmed = confirm('Remove this player from the group?');
  if (!confirmed) return;

  const { error } = await window._supabase
    .from('Group Members')
    .delete()
    .eq('group_id', groupId)
    .eq('player_id', targetPlayerId);

  if (error) {
    alert('Failed to remove member. Please try again.');
  } else {
    // Reload the page to reflect the updated members list
    window.location.href = 'https://swishpass.webflow.io/group-profiles?group_number=' + groupNumber;
  }
}

// ============================================================
// LEAVE GROUP — member initiated, owner must transfer first
// ============================================================

async function leaveGroup(group, members, currentPlayerId) {
  const myMembership = members.find(m => m.player_id === currentPlayerId);
  if (!myMembership) return;

  const isOwner = myMembership.role === 'owner';
  const otherMembers = members.filter(m => m.player_id !== currentPlayerId);

  if (isOwner && otherMembers.length === 0) {
    // Last member — prompt to delete instead
    const confirmed = confirm('You are the only member. Leaving will delete the group. Continue?');
    if (!confirmed) return;
    await deleteGroup(group);
    return;
  }

  if (isOwner && otherMembers.length > 0) {
    // Must transfer ownership first
    const transferPanel = document.querySelector('[data-group="transfer-ownership-panel"]');
    if (transferPanel) {
      transferPanel.style.display = 'block';
      populateTransferOptions(otherMembers, group, currentPlayerId);
    } else {
      alert('You must transfer ownership before leaving. Use the Transfer Ownership option.');
    }
    return;
  }

  // Regular member — just leave
  const confirmed = confirm('Leave this group?');
  if (!confirmed) return;

  const { error } = await window._supabase
    .from('Group Members')
    .delete()
    .eq('group_id', group.id)
    .eq('player_id', currentPlayerId);

if (error) {
    alert('Failed to leave group. Please try again.');
  } else {
    window.location.href = 'https://swishpass.webflow.io/group-search';
  }
}

// ============================================================
// TRANSFER OWNERSHIP — populates dropdown before owner leaves
// ============================================================

async function populateTransferOptions(otherMembers, group, currentPlayerId) {
  const select = document.querySelector('[data-group="transfer-select"]');
  const confirmBtn = document.querySelector('[data-action="confirm-transfer"]');
  if (!select || !confirmBtn) return;

  // Get usernames for other members
  const { data: players } = await window._supabase
    .from('Players')
    .select('player_id, Username')
    .in('player_id', otherMembers.map(m => m.player_id));

  select.innerHTML = '<option value="">Select new owner...</option>';
  if (players) {
    players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.player_id;
      opt.textContent = p.Username;
      select.appendChild(opt);
    });
  }

  confirmBtn.onclick = async () => {
    const newOwnerId = parseInt(select.value);
    if (!newOwnerId) {
      alert('Please select a new owner.');
      return;
    }

    // Update new owner's role
    const { error: promoteError } = await window._supabase
      .from('Group Members')
      .update({ role: 'owner' })
      .eq('group_id', group.id)
      .eq('player_id', newOwnerId);

    if (promoteError) {
      alert('Failed to transfer ownership. Please try again.');
      return;
    }

    // Update Groups.created_by
    await window._supabase
      .from('Groups')
      .update({ created_by: newOwnerId })
      .eq('id', group.id);

    // Remove current owner from members
    const { error: leaveError } = await window._supabase
      .from('Group Members')
      .delete()
      .eq('group_id', group.id)
      .eq('player_id', currentPlayerId);

    if (leaveError) {
      alert('Ownership transferred but failed to remove you from group. Contact support.');
      return;
    }

window.location.href = 'https://swishpass.webflow.io/group-search';
};
}

// ============================================================
// DELETE GROUP — owner only
// ============================================================

async function deleteGroup(group) {
  const confirmed = confirm(`Permanently delete "${group.group_name}"? This cannot be undone.`);
  if (!confirmed) return;

  // Delete all members first (FK safety)
  await window._supabase
    .from('Group Members')
    .delete()
    .eq('group_id', group.id);

  // Delete the group
  const { error } = await window._supabase
    .from('Groups')
    .delete()
    .eq('id', group.id);

if (error) {
    alert('Failed to delete group. Please try again.');
  } else {
    window.location.href = 'https://swishpass.webflow.io/group-search';
  }
}



// ============================================================
// PAGE INIT ROUTER — add these calls inside DOMContentLoaded
// ============================================================
// if (window.location.pathname === '/create-group') initCreateGroup();
// if (window.location.pathname === '/group-profiles') loadGroupProfile();

// ============================================================
// SIGN OUT
// ============================================================

async function signOut() {
  const { error } = await window._supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    return;
  }
  window.location.href = '/sign-in';
}
// ========================================
// /confirm-email
// ========================================
window.addEventListener('load', async function () {
  if (!document.getElementById('confirm-email-container')) return;

  const container = document.getElementById('confirm-email-container');

  // Handle the token from the email link (arrives in URL hash)
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    // Supabase picks this up automatically via onAuthStateChange,
    // but we need to give it a moment to process
    container.innerHTML = '<p style="text-align:center;padding:2rem;color:#888;">Verifying your email...</p>';

    // Wait for session to resolve
    await new Promise(resolve => setTimeout(resolve, 1200));

    const { data: { session } } = await window._supabase.auth.getSession();
    if (session && session.user.email_confirmed_at) {
      window.location.href = '/username-setup';
      return;
    }
  }

  // Check if already confirmed (returning user who somehow landed here)
  const { data: { session } } = await window._supabase.auth.getSession();
  if (session && session.user.email_confirmed_at) {
    // Already confirmed — check onboarding state
    const { data: player } = await window._supabase
      .from('Players')
      .select('"Username", "Position"')
      .eq('auth_user_id', session.user.id)
      .single();

    if (!player || !player.Username) {
      window.location.href = '/username-setup';
    } else if (!player.Position) {
      window.location.href = '/profile-setup';
    } else {
      window.location.href = '/sp-home';
    }
    return;
  }

  // Not confirmed yet — show the holding screen
  container.innerHTML = `
    <div style="max-width:440px;margin:60px auto;padding:32px;text-align:center;font-family:inherit;">
      <div style="font-size:48px;margin-bottom:16px;">📧</div>
      <h2 style="font-size:24px;font-weight:700;color:#111;margin:0 0 8px;">Check your email</h2>
      <p style="font-size:15px;color:#666;margin:0 0 24px;line-height:1.5;">
        We sent a confirmation link to your email address. Click it to activate your account and continue setup.
      </p>
      <p style="font-size:13px;color:#888;margin:0 0 24px;">
        Didn't get it? Check your spam folder — it may have landed there.
      </p>
      <button id="resend-confirmation-btn" onclick="resendConfirmation()" 
        style="padding:12px 24px;background:#f2f2f2;color:#111;border:1px solid #ddd;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">
        Resend confirmation email
      </button>
      <p style="font-size:13px;color:#888;margin-top:24px;">
        Wrong email? <a href="/sign-up" style="color:#378add;">Start over</a>
      </p>
    </div>
  `;
});

window.resendConfirmation = async function () {
  const btn = document.getElementById('resend-confirmation-btn');
  const { data: { session } } = await window._supabase.auth.getSession();

  if (!session) {
    alert('Session expired. Please sign up again.');
    window.location.href = '/sign-up';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  const { error } = await window._supabase.auth.resend({
    type: 'signup',
    email: session.user.email,
options: { emailRedirectTo: 'https://swishpass.webflow.io/sign-in' }
  });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Resend confirmation email';
    alert('Error resending. Please try again.');
  } else {
    btn.textContent = 'Sent ✓';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Resend confirmation email';
    }, 5000);
  }
};
// ========================================
// PROFILE VIEW — loads any player's data
// Replaces old Airtable script entirely
// ========================================
window.addEventListener('load', async function () {
  if (!document.getElementById('player-username')) return;
  await new Promise(function(resolve) {
    var check = setInterval(function() {
      window._supabase.auth.getSession().then(function(r) {
        if (r.data.session) { clearInterval(check); resolve(); }
      });
    }, 200);
    setTimeout(function() { clearInterval(check); resolve(); }, 3000);
  });

  var urlParams = new URLSearchParams(window.location.search);
var playerNumber = parseInt(urlParams.get('player_profile_number'), 10);

  if (!playerNumber) {
    document.getElementById('player-username').textContent = 'No player specified.';
    return;
  }

var result = await window._supabase
    .from('Players')
    .select('"Username", "XP", "Tier", "State/Province", "Country", "Position", "Top Skill", "Favorite Player", "Profile Photo URL", "Created", "MVP Count", "Session Totals", "Ranking", "Legacy Points"')
    .eq('player_id', playerNumber)
    .single();

  if (result.error || !result.data) {
    document.getElementById('player-username').textContent = 'Player not found.';
    return;
  }

  var p = result.data;

  // Core identity
  var usernameEl = document.getElementById('player-username');
  if (usernameEl) usernameEl.textContent = p.Username || 'Unknown';

  var tierEl = document.getElementById('player-tier');
  if (tierEl) tierEl.textContent = p.Tier || 'N/A';

  var xpEl = document.getElementById('player-xp');
  if (xpEl) xpEl.textContent = p.XP || 0;

var rankingEl = document.getElementById('player-tier');
  if (rankingEl) rankingEl.textContent = (p.Tier || 'N/A') + ' · #' + (p.Ranking || 'N/A');

  // Location
  var countryEl = document.getElementById('player-country');
  if (countryEl) countryEl.textContent = p.Country || 'N/A';

  var cityEl = document.getElementById('player-city');
  if (cityEl) cityEl.textContent = p['State/Province'] || 'N/A';

  // Player details
  var positionEl = document.getElementById('player-position');
  if (positionEl) positionEl.textContent = p.Position || 'N/A';

  var skillEl = document.getElementById('player-top-skill');
  if (skillEl) skillEl.textContent = p['Top Skill'] || 'N/A';

  var favEl = document.getElementById('player-favorite-player');
  if (favEl) favEl.textContent = p['Favorite Player'] || 'N/A';

  var createdEl = document.getElementById('player-created');
  if (createdEl) createdEl.textContent = p.Created
    ? new Date(p.Created).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A';

  // Stats
var mvpEl = document.getElementById('player-mvp-count');
  if (mvpEl) mvpEl.textContent = p['MVP Count'] || 0;

  // Photos
  var photoEl = document.getElementById('player-profile-photo');
  if (photoEl && p['Profile Photo URL']) photoEl.src = p['Profile Photo URL'];

  var badgeEl = document.getElementById('player-badge-image');

  // Friend/report buttons — only show if viewing someone else's profile
  var currentPlayer = await getCurrentPlayer();
  var isSelf = currentPlayer.playerId && currentPlayer.playerId == playerNumber;

  var reportBtn = document.getElementById('report-button');
  var unfriendBtn = document.getElementById('unfriend-button');

  if (isSelf) {
    if (reportBtn) reportBtn.style.display = 'none';
    if (unfriendBtn) unfriendBtn.style.display = 'none';
  }
});
// ========================================
// PERSONAL PROFILE — /profile page
// Loads logged-in player's own data
// ========================================
window.addEventListener('load', async function () {
  if (window.location.pathname !== '/profile') return;

  var player = await getCurrentPlayer();
  if (!player || !player.playerId) return;

  var result = await window._supabase
    .from('Players')
    .select('"Username", "XP", "Tier", "State/Province", "Country", "Position", "Top Skill", "Favorite Player", "Profile Photo URL", "Created", "MVP Count", "Session Totals", "Ranking", "Legacy Points", "player_id"')
    .eq('player_id', player.playerId)
    .single();

  if (result.error || !result.data) return;

  var p = result.data;

  // ── Populate personal-player-number first ──────────────────────────────
  // This unlocks sf-player-container, badges-earned-player-container,
  // legacy-container — all sections that depend on knowing the player ID
  var playerNumEl = document.getElementById('personal-player-number');
  if (playerNumEl) playerNumEl.textContent = p.player_id;

  // ── Element ID fields ──────────────────────────────────────────────────
  var usernameId = document.getElementById('username-ID');
  if (usernameId) usernameId.textContent = '@' + (p.Username || 'Unknown');

  var proPic = document.getElementById('player-pro-pic');
  if (proPic && p['Profile Photo URL']) proPic.src = p['Profile Photo URL'];

  var favorite = document.getElementById('favorite');
  if (favorite) favorite.textContent = p['Favorite Player'] || 'N/A';

  var createdDate = document.getElementById('member-created-date');
  if (createdDate) createdDate.textContent = p.Created
    ? new Date(p.Created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  var xpEl = document.getElementById('player-xp');
  if (xpEl) xpEl.textContent = (p.XP || 0).toLocaleString();

  // ── data-user fields (backup in case autofillUser hasn't run yet) ──────
  document.querySelectorAll('[data-user]').forEach(function(el) {
    var key = el.getAttribute('data-user');
    var value = null;

    if (key === 'username')        value = p.Username;
    if (key === 'tier')            value = p.Tier;
    if (key === 'xp')              value = p.XP;
    if (key === 'country')         value = p.Country;
    if (key === 'state')           value = p['State/Province'];
    if (key === 'position')        value = p.Position;
    if (key === 'top-skill')       value = p['Top Skill'];
    if (key === 'favorite-player') value = p['Favorite Player'];
    if (key === 'created')         value = p.Created
      ? new Date(p.Created).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
      : '';
    if (key === 'player-id')       value = p.player_id;

    if (value !== null) el.textContent = value;

    if (key === 'photo' && p['Profile Photo URL']) {
      el.src = p['Profile Photo URL'];
    }
  });

  // ── Trigger dependent sections now that player ID is set ───────────────
  // sf-player and badges-earned read from personal-player-number div
  // Re-trigger them now that the div is populated
  if (document.getElementById('sf-player-container')) {
    sfPlayerTargetId = String(p.player_id);
    sfPlayerPage = 0;
    sfPlayerDone = false;
    window.initSFPlayer();
  }

  if (document.getElementById('badges-earned-player-container')) {
    badgesEarnedPlayerTargetId = String(p.player_id);
    window.loadBadgesEarnedPlayer();
  }

  if (document.getElementById('legacy-container')) {
    await loadLegacySection(p.player_id);
  }
});
// ========================================
// LEGACY SECTION — Player profile page
// ========================================
window.addEventListener('load', async function () {
  if (!document.getElementById('legacy-container')) return;

  var urlParams = new URLSearchParams(window.location.search);
  var targetPlayerId = urlParams.get('player_profile_number');

  // Fallback: own profile — get from session directly
  if (!targetPlayerId) {
    var player = await getCurrentPlayer();
    if (player && player.playerId) {
      targetPlayerId = player.playerId;
    }
  }

  if (!targetPlayerId) {
    document.getElementById('legacy-container').innerHTML =
      '<p style="color:#888;font-size:14px;padding:1rem 0;">No player specified.</p>';
    return;
  }

  await loadLegacySection(targetPlayerId);
});

window.loadLegacySection = async function (targetPlayerId) {
  const container = document.getElementById('legacy-container');
  if (!container) return;

  container.innerHTML = '<p style="color:#888;font-size:14px;padding:1rem 0;">Loading legacy...</p>';

  const { data: playerData, error: playerError } = await window._supabase
    .from('Players')
    .select('"Legacy Points"')
    .eq('player_id', targetPlayerId)
    .single();

  if (playerError) {
    container.innerHTML = '<p style="color:#888;font-size:14px;padding:1rem 0;">Could not load legacy data.</p>';
    return;
  }

  const legacyPoints = playerData['Legacy Points'] || 0;

  const { data: allSeasons } = await window._supabase
    .from('seasons')
    .select('season_id, season_name, start_date, end_date, is_active, season_number')
    .order('season_number', { ascending: false });

  const { data: records } = await window._supabase
    .from('Season_Records')
    .select('season_id, season_number, final_xp, final_tier, final_rank, session_count, mvp_votes_received, badges_earned')
    .eq('player_id', targetPlayerId)
    .order('season_number', { ascending: false });

  const recordMap = {};
  (records || []).forEach(function (r) { recordMap[r.season_id] = r; });

  const formatDate = function (iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const seasonCards = (allSeasons || []).map(function (season) {
    const record = recordMap[season.season_id];
    const isFuture = !record && !season.is_active;
    const isActive = season.is_active;

    if (isFuture) {
      return '<div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 20px;position:relative;overflow:hidden;opacity:0.5;">'
        + '<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#ddd;border-radius:3px 0 0 3px;"></div>'
        + '<div style="padding-left:14px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div>'
        + '<span style="font-size:12px;font-weight:500;color:#888;background:#f5f5f5;padding:3px 10px;border-radius:6px;border:1px solid #eee;">' + season.season_name + '</span>'
        + '<p style="font-size:12px;color:#aaa;margin:4px 0 0;">' + formatDate(season.start_date) + ' — ' + (season.end_date ? formatDate(season.end_date) : 'TBD') + '</p>'
        + '</div>'
        + '<p style="font-size:13px;color:#aaa;margin:0;">Not yet started</p>'
        + '</div>'
        + '</div>';
    }

    if (isActive && !record) {
      return '<div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 20px;position:relative;overflow:hidden;">'
        + '<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#378add;border-radius:3px 0 0 3px;"></div>'
        + '<div style="padding-left:14px;display:flex;align-items:center;justify-content:space-between;">'
        + '<div>'
        + '<span style="font-size:12px;font-weight:500;color:#378add;background:#e6f1fb;padding:3px 10px;border-radius:6px;">' + season.season_name + ' · In progress</span>'
        + '<p style="font-size:12px;color:#aaa;margin:4px 0 0;">' + formatDate(season.start_date) + ' — ' + formatDate(season.end_date) + '</p>'
        + '</div>'
        + '<p style="font-size:13px;color:#888;margin:0;">Season ongoing</p>'
        + '</div>'
        + '</div>';
    }

    if (!record) return '';

    const badgesHtml = (record.badges_earned && record.badges_earned.length > 0)
      ? record.badges_earned.map(function (badge) {
          return '<span style="font-size:12px;color:#555;background:#f5f5f5;border:1px solid #eee;border-radius:6px;padding:4px 10px;">' + badge + '</span>';
        }).join('')
      : '<span style="font-size:12px;color:#aaa;">No badges earned this season</span>';

    return '<div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px 20px;position:relative;overflow:hidden;">'
      + '<div style="position:absolute;top:0;left:0;width:3px;height:100%;background:#378add;border-radius:3px 0 0 3px;"></div>'
      + '<div style="padding-left:14px;">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;">'
      + '<div>'
      + '<span style="font-size:12px;font-weight:500;color:#378add;background:#e6f1fb;padding:3px 10px;border-radius:6px;">' + season.season_name + '</span>'
      + '<p style="font-size:12px;color:#aaa;margin:4px 0 0;">' + formatDate(season.start_date) + ' — ' + formatDate(season.end_date) + '</p>'
      + '</div>'
      + '<div style="text-align:right;">'
      + '<p style="font-size:28px;font-weight:500;color:#111;margin:0;line-height:1;">#' + (record.final_rank || '—') + '</p>'
      + '<p style="font-size:11px;color:#aaa;margin:2px 0 0;text-transform:uppercase;letter-spacing:1px;">Final rank</p>'
      + '</div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">'
      + '<div style="background:#f9f9f9;border-radius:8px;padding:10px 12px;">'
      + '<p style="font-size:11px;color:#aaa;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Final XP</p>'
      + '<p style="font-size:18px;font-weight:500;color:#111;margin:0;">' + (record.final_xp || 0).toLocaleString() + '</p>'
      + '</div>'
      + '<div style="background:#f9f9f9;border-radius:8px;padding:10px 12px;">'
      + '<p style="font-size:11px;color:#aaa;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Sessions</p>'
      + '<p style="font-size:18px;font-weight:500;color:#111;margin:0;">' + (record.session_count || 0) + '</p>'
      + '</div>'
      + '<div style="background:#f9f9f9;border-radius:8px;padding:10px 12px;">'
      + '<p style="font-size:11px;color:#aaa;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">MVP votes</p>'
      + '<p style="font-size:18px;font-weight:500;color:#111;margin:0;">' + (record.mvp_votes_received || 0) + '</p>'
      + '</div>'
      + '</div>'
      + '<div>'
      + '<p style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Badges earned</p>'
      + '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + badgesHtml + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:680px;">'
    + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem;">'
    + '<div>'
    + '<p style="font-size:11px;font-weight:500;color:#aaa;letter-spacing:2px;text-transform:uppercase;margin:0 0 4px;">Player legacy</p>'
    + '<h2 style="font-size:22px;font-weight:500;color:#111;margin:0;">Season history</h2>'
    + '</div>'
    + '<div style="text-align:right;">'
    + '<p style="font-size:11px;color:#aaa;margin:0 0 2px;text-transform:uppercase;letter-spacing:1px;">Legacy points</p>'
    + '<p style="font-size:32px;font-weight:500;color:#111;margin:0;line-height:1;">' + legacyPoints.toLocaleString() + '</p>'
    + '</div>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:12px;">'
    + (seasonCards || '<p style="color:#888;font-size:14px;">No season history yet.</p>')
    + '</div>'
    + '<div style="margin-top:10px;padding:10px 14px;background:#f9f9f9;border-radius:8px;">'
    + '<p style="font-size:12px;color:#aaa;margin:0;">Legacy points accumulate across all seasons and never reset. Season history is locked at season end.</p>'
    + '</div>'
    + '</div>';
};
// ========================================
// HEADER AUTH UI
// ========================================
function updateHeaderAuthUI(session) {
  var signInBtn  = document.getElementById('sign-in-btn');
  var signOutBtn = document.getElementById('sign-out-btn');
  var welcomeMsg = document.getElementById('welcome-msg');

  if (session) {
    if (signInBtn)  signInBtn.style.display = 'none';
    if (signOutBtn) signOutBtn.style.display = 'block';

    // Welcome message — only on /sp-home
    if (welcomeMsg) {
      if (window.location.pathname === '/sp-home') {
        window._supabase
          .from('Players')
          .select('"Username"')
          .eq('auth_user_id', session.user.id)
          .single()
          .then(function(result) {
            if (result.data && result.data.Username) {
welcomeMsg.innerHTML = 'Welcome, <span style="color: #0060ff;">' + result.data.Username + '</span>';
welcomeMsg.style.display = 'block';
welcomeMsg.style.fontSize = window.innerWidth <= 991 ? '26px' : '48px';
welcomeMsg.style.fontWeight = '700';
welcomeMsg.style.color = '#111';
welcomeMsg.style.letterSpacing = '-1px';
welcomeMsg.style.lineHeight = '1.1';
welcomeMsg.style.fontFamily = 'inherit';
            }
          });
      } else {
        welcomeMsg.style.display = 'none';
      }
    }

  } else {
    if (signInBtn)  signInBtn.style.display = 'block';
    if (signOutBtn) signOutBtn.style.display = 'none';
    if (welcomeMsg) welcomeMsg.style.display = 'none';
  }
}

// Set header state on every page load
window._supabase.auth.getSession().then(function(result) {
  updateHeaderAuthUI(result.data.session);
  if (result.data.session) {
    setTimeout(function() { autofillUser(); }, 800);
  }
});
// ========================================
// SIDEBAR + HOME STATS INJECTION
// ========================================
function updateSidebarUI(player) {
  var sidebar = document.getElementById('profile-info');
  if (sidebar) {
    sidebar.innerHTML = ''
      + '<img src="' + (player['Profile Photo URL'] || '') + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover;display:block;margin-bottom:10px;" />'
      + '<p style="font-size:15px;font-weight:600;color:#111;margin:0;">@' + (player.Username || '') + '</p>';
  }

  // Only inject stats on /sp-home
  if (window.location.pathname === '/sp-home') {
    var tierEl    = document.getElementById('tier');
    var rankingEl = document.getElementById('ranking');
    var xpEl      = document.getElementById('XP');

    if (tierEl)    tierEl.textContent    = player.Tier    || 'N/A';
    if (rankingEl) rankingEl.textContent = player.Ranking || 'N/A';
    if (xpEl)      xpEl.textContent      = player.XP      || 0;
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// PROOF OF PLAY — Add a Court
// Paste at the bottom of main.js
// Div Block on Webflow page must have ID: court-submit-root
// Uses window._supabase already initialized in Webflow head code
// ─────────────────────────────────────────────────────────────────────────────

(function () {

  var CS_BYTESCALE_ACCT = 'G22nhnC';
  var CS_BYTESCALE_KEY  = 'Bearer public_G22nhnC83CH88avhAZxjkQq4tdkn';
  var cs_selectedType   = '';

  // ── Field value helper ──────────────────────────────────────────────────────
  function cs_val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function cs_setError(fieldId, msg) {
    var field = document.getElementById('cs-field-' + fieldId);
    if (field) field.classList.add('cs-invalid');
    var err = document.getElementById('cs-err-' + fieldId);
    if (err) { err.textContent = '⚠ ' + msg; err.style.display = 'flex'; }
  }
  function cs_clearAllErrors() {
    document.querySelectorAll('.cs-field').forEach(function(f) { f.classList.remove('cs-invalid'); });
    document.querySelectorAll('.cs-err').forEach(function(e) { e.style.display = 'none'; });
  }
 function cs_validate() {
    cs_clearAllErrors();
    var ok = true;

    // Access type validation
    var accessType = window._cs_getAccessType ? window._cs_getAccessType() : '';
    if (!accessType) {
      cs_setError('access-type', 'Please select who can access this court');
      ok = false;
    }
    if (accessType === 'restricted') {
      var notes = window._cs_getAccessNotes ? window._cs_getAccessNotes() : '';
      if (!notes) {
        cs_setError('access-notes', 'Please describe the access conditions');
        ok = false;
      }
    }

    if (!cs_val('cs-court-name')) { cs_setError('court-name', 'Court name is required'); ok = false; }
    if (!cs_selectedType)         { cs_setError('court-type', 'Please select a facility type'); ok = false; }
    if (!cs_val('cs-city'))       { cs_setError('city', 'City is required'); ok = false; }
    if (!cs_val('cs-state'))      { cs_setError('state', 'State is required'); ok = false; }
    if (!cs_val('cs-country'))    { cs_setError('country', 'Country is required'); ok = false; }
    var lat = parseFloat(cs_val('cs-latitude'));
    var lng = parseFloat(cs_val('cs-longitude'));
    if (!cs_val('cs-latitude')  || isNaN(lat) || lat < -90  || lat > 90)  { cs_setError('latitude',  'Valid latitude required (−90 to 90)'); ok = false; }
    if (!cs_val('cs-longitude') || isNaN(lng) || lng < -180 || lng > 180) { cs_setError('longitude', 'Valid longitude required (−180 to 180)'); ok = false; }
    return ok;
  }
  // ── Toast ───────────────────────────────────────────────────────────────────
  function cs_showToast(msg, type) {
    var t = document.getElementById('cs-toast');
    if (!t) return;
    t.textContent = (type === 'error' ? '✕  ' : '✓  ') + msg;
    t.className = 'cs-toast cs-toast-' + (type || 'success') + ' cs-toast-show';
    setTimeout(function() { t.className = 'cs-toast'; }, 4000);
  }

  // ── Photo preview ───────────────────────────────────────────────────────────
  function cs_handleFileSelect(input) {
    var file = input.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { cs_showToast('Photo must be under 10MB', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      var preview = document.getElementById('cs-photo-preview');
      if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
      var content = document.getElementById('cs-photo-content');
      if (content) content.style.display = 'none';
      var change = document.getElementById('cs-photo-change');
      if (change) change.style.display = 'block';
      var drop = document.getElementById('cs-photo-drop');
      if (drop) { drop.style.padding = '0'; drop.style.borderStyle = 'solid'; drop.style.borderColor = '#0060ff'; }
    };
    reader.readAsDataURL(file);
  }

  // ── Bytescale upload ────────────────────────────────────────────────────────
  async function cs_uploadPhoto(file) {
    var buf = await file.arrayBuffer();
    var res = await fetch(
      'https://api.bytescale.com/v2/accounts/' + CS_BYTESCALE_ACCT + '/uploads/binary',
      {
        method: 'POST',
        headers: {
          'Authorization': CS_BYTESCALE_KEY,
          'Content-Type': file.type || 'image/jpeg',
          'X-Bytescale-Filename': 'court_' + Date.now() + '.jpg'
        },
        body: buf
      }
    );
    if (!res.ok) throw new Error('Photo upload failed');
    var data = await res.json();
    return 'https://upcdn.io/' + CS_BYTESCALE_ACCT + '/raw' + data.filePath;
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  window.resetCourtForm = function() {
    var form = document.getElementById('cs-form');
    if (form) { form.reset(); form.style.display = ''; }
    var success = document.getElementById('cs-success');
    if (success) success.style.display = 'none';
    document.querySelectorAll('.cs-toggle-btn').forEach(function(b) { b.classList.remove('cs-active'); });
cs_selectedType   = '';
    if (window._cs_getAccessType) window._cs_getAccessType = function() { return ''; };
    document.querySelectorAll('.cs-access-btn').forEach(function(b) { b.classList.remove('cs-active'); });
    document.getElementById('cs-walkin-detail').style.display    = 'none';
    document.getElementById('cs-restricted-detail').style.display = 'none';
    cs_clearAllErrors();
    var preview = document.getElementById('cs-photo-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    var content = document.getElementById('cs-photo-content');
    if (content) content.style.display = '';
    var change = document.getElementById('cs-photo-change');
    if (change) change.style.display = 'none';
    var drop = document.getElementById('cs-photo-drop');
    if (drop) { drop.style.padding = ''; drop.style.borderStyle = ''; drop.style.borderColor = ''; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function cs_handleSubmit(e) {
    e.preventDefault();
    if (!cs_validate()) return;

    var btn     = document.getElementById('cs-submit-btn');
    var btnText = document.getElementById('cs-btn-text');
    var spinner = document.getElementById('cs-spinner');
    btn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'block';

    try {
      // 1. Get logged-in player_id via window._supabase
      var addedBy = null;
      try {
        var sessionResult = await window._supabase.auth.getSession();
        var session = sessionResult.data.session;
        if (session && session.user) {
          var playerResult = await window._supabase
            .from('Players')
            .select('player_id')
            .eq('auth_user_id', session.user.id)
            .limit(1);
          if (playerResult.data && playerResult.data.length > 0) {
            addedBy = playerResult.data[0].player_id;
          }
        }
      } catch(authErr) { /* non-fatal */ }

      // 2. Check for duplicate courts nearby (100m radius)
      var courtName = cs_val('cs-court-name');
      var lat = parseFloat(cs_val('cs-latitude'));
      var lng = parseFloat(cs_val('cs-longitude'));
      
      var dupCheckResult = await window._supabase.rpc('check_court_duplicate_webflow', {
        p_court_name: courtName,
        p_address: cs_val('cs-address') || null,
        p_latitude: lat,
        p_longitude: lng,
        p_indoor_or_outdoor: cs_selectedType
      });

      if (dupCheckResult.error) {
        console.error('Duplicate check error:', dupCheckResult.error);
        // Non-fatal — proceed anyway
      } else if (dupCheckResult.data && dupCheckResult.data.length > 0) {
        var dupResult = dupCheckResult.data[0];
        if (dupResult.duplicate_found) {
          btn.disabled = false;
          if (btnText) btnText.style.display = '';
          if (spinner) spinner.style.display = 'none';
          
          var distance = Math.round(dupResult.distance_m);
          var facilityText = cs_selectedType === 'Both' ? 'indoor and outdoor facilities' : 'an ' + cs_selectedType + ' court';
          var message = '"' + dupResult.existing_court_name + '" is already registered ' + distance + 'm from this location. If that court also has ' + facilityText + ', please let us know and we\'ll update it instead. Any other issues and please contact us via email.';
          
          alert(message);
          return;
        }
      }

      // 3. Upload photo if file selected
      var photoUrl = cs_val('cs-photo-url') || null;
      var fileInput = document.getElementById('cs-photo-file');
      if (fileInput && fileInput.files.length > 0 && !photoUrl) {
        try { photoUrl = await cs_uploadPhoto(fileInput.files[0]); }
        catch(e) { cs_showToast('Photo upload failed — submitting without it', 'error'); }
      }

// 4. Build payload
      var accessType  = window._cs_getAccessType  ? window._cs_getAccessType()  : 'public';
      var accessNotes = window._cs_getAccessNotes ? window._cs_getAccessNotes() : null;

      var has_indoor  = cs_selectedType === 'Indoor'  || cs_selectedType === 'Both';
      var has_outdoor = cs_selectedType === 'Outdoor' || cs_selectedType === 'Both';

      var payload = {
        court_name:   courtName,
        court_type:   cs_selectedType,
        latitude:     lat,
        longitude:    lng,
        city:         cs_val('cs-city'),
        state:        cs_val('cs-state'),
        Country:      cs_val('cs-country'),
        verified:     0,
        has_indoor:   has_indoor,
        has_outdoor:  has_outdoor,
        access_type:  accessType
      };
      if (cs_val('cs-address'))   payload.address          = cs_val('cs-address');
      if (cs_val('cs-zip'))       payload.zip_code         = cs_val('cs-zip');
      if (photoUrl)               payload['Court Photo']   = photoUrl;
      if (addedBy)                payload.added_by         = addedBy;
      if (accessNotes)            payload.access_notes     = accessNotes;

      // 5. Insert via window._supabase
      var insertResult = await window._supabase
        .from('Courts')
        .insert(payload);

      if (insertResult.error) throw new Error(insertResult.error.message);

      // 6. Success
      var form = document.getElementById('cs-form');
      if (form) form.style.display = 'none';
      var success = document.getElementById('cs-success');
      if (success) success.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch(err) {
      console.error('[SubmitCourt]', err);
      cs_showToast(err.message || 'Submission failed — please try again', 'error');
    } finally {
      btn.disabled = false;
      if (btnText) btnText.style.display = '';
      if (spinner) spinner.style.display = 'none';
    }
  }

  // ── Inject CSS ──────────────────────────────────────────────────────────────
  function cs_injectStyles() {
    if (document.getElementById('cs-styles')) return;
    var style = document.createElement('style');
    style.id = 'cs-styles';
    style.textContent = [
'#court-submit-root { font-family: "DM Sans", sans-serif; font-size: 15px; line-height: 1.5; color: #080f24; max-width: 640px; margin: 0 auto; padding: 40px 16px 80px; box-sizing: border-box; width: 100%; }',
      '#court-submit-root * { box-sizing: border-box; }',
      '.cs-eyebrow { font-family: "DM Mono", monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #0060ff; margin-bottom: 10px; }',
      '.cs-title { font-family: "Bebas Neue", sans-serif; font-size: clamp(56px, 10vw, 80px); line-height: 0.92; letter-spacing: 0.02em; color: #080f24; margin-bottom: 16px; }',
      '.cs-title span { color: #0060ff; }',
      '.cs-subtitle { color: #7a87ab; font-size: 14px; line-height: 1.65; max-width: 480px; margin-bottom: 36px; }',
      '.cs-divider { height: 1px; background: linear-gradient(90deg, #0060ff 0%, #dde3f5 50%, transparent 100%); margin: 28px 0; }',
      '.cs-section { font-family: "DM Mono", monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #7a87ab; margin: 8px 0 18px; display: flex; align-items: center; gap: 10px; }',
      '.cs-section::after { content: ""; flex: 1; height: 1px; background: #dde3f5; }',
      '.cs-form { display: flex; flex-direction: column; gap: 18px; }',
      '.cs-field { display: flex; flex-direction: column; gap: 6px; }',
      '.cs-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #4a5680; display: flex; align-items: center; gap: 6px; }',
      '.cs-req { color: #0060ff; }',
      '.cs-opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: #7a87ab; font-size: 10px; }',
      '.cs-hint { font-size: 12px; color: #7a87ab; }',
      '#court-submit-root input[type="text"], #court-submit-root input[type="number"], #court-submit-root textarea { background: #f4f7ff; border: 1px solid #dde3f5; border-radius: 8px; color: #080f24; font-family: "DM Sans", sans-serif; font-size: 15px; padding: 12px 14px; outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; -webkit-appearance: none; appearance: none; }',
      '#court-submit-root input[type="text"]:focus, #court-submit-root input[type="number"]:focus { border-color: #0060ff; box-shadow: 0 0 0 3px rgba(0,96,255,0.2); }',
      '#court-submit-root input::placeholder { color: #7a87ab; }',
      '#court-submit-root input[type="number"] { font-family: "DM Mono", monospace; }',
      '.cs-field.cs-invalid input, .cs-field.cs-invalid textarea { border-color: #EF4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }',
      '.cs-err { font-size: 12px; color: #EF4444; display: none; align-items: center; gap: 4px; }',
      '.cs-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }',
      '.cs-row-csz { display: grid; grid-template-columns: 1fr 72px 108px; gap: 12px; }',
      '@media (max-width: 500px) { .cs-row-csz { grid-template-columns: 1fr 1fr; } .cs-row-csz .cs-field:first-child { grid-column: 1 / -1; } }',
      '.cs-coords-box { background: #edf1fd; border: 1px solid #dde3f5; border-radius: 10px; padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; }',
      '.cs-coords-note { font-family: "DM Mono", monospace; font-size: 11px; color: #7a87ab; line-height: 1.6; }',
      '.cs-coords-note a { color: #0060ff; text-decoration: none; }',
      '.cs-toggle-row { display: flex; gap: 10px; }',
      '.cs-toggle-btn { flex: 1; background: #f4f7ff; border: 1px solid #dde3f5; border-radius: 8px; color: #7a87ab; cursor: pointer; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; padding: 12px 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: all 0.15s; }',
      '.cs-toggle-btn:hover { border-color: #b3c4f0; color: #080f24; }',
      '.cs-toggle-btn.cs-active { background: rgba(0,96,255,0.08); border-color: #0060ff; color: #0060ff; }',
      '.cs-toggle-icon { font-size: 20px; }',
      '.cs-photo-drop { background: #f4f7ff; border: 1.5px dashed #dde3f5; border-radius: 10px; padding: 28px 20px; text-align: center; cursor: pointer; position: relative; overflow: hidden; transition: all 0.15s; }',
      '.cs-photo-drop:hover { border-color: #0060ff; background: rgba(0,96,255,0.08); }',
      '.cs-photo-drop input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }',
      '.cs-photo-icon { font-size: 28px; margin-bottom: 8px; }',
      '.cs-photo-text { color: #7a87ab; font-size: 13px; line-height: 1.5; }',
      '.cs-photo-text strong { color: #0060ff; font-weight: 600; }',
      '#cs-photo-preview { width: 100%; height: 200px; object-fit: cover; border-radius: 9px; display: none; }',
      '#cs-photo-change { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.5)); color: #0060ff; font-size: 12px; font-weight: 600; padding: 20px 12px 10px; pointer-events: none; display: none; }',
      '.cs-submit-btn { background: #0060ff; border: none; border-radius: 10px; color: #fff; cursor: pointer; font-family: "Bebas Neue", sans-serif; font-size: 20px; letter-spacing: 0.08em; padding: 16px 24px; width: 100%; margin-top: 8px; position: relative; transition: opacity 0.15s, transform 0.1s; }',
      '.cs-submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }',
      '.cs-submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }',
      '#cs-spinner { display: none; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.35); border-top-color: #fff; border-radius: 50%; animation: cs-spin 0.6s linear infinite; margin: 0 auto; }',
      '@keyframes cs-spin { to { transform: rotate(360deg); } }',
      '.cs-disclaimer { font-size: 12px; color: #7a87ab; text-align: center; line-height: 1.6; margin-top: 4px; }',
      '.cs-success { display: none; background: rgba(34,197,94,0.07); border: 1px solid #22C55E; border-radius: 12px; padding: 32px 24px; text-align: center; flex-direction: column; align-items: center; gap: 10px; }',
      '.cs-success-icon { font-size: 36px; }',
      '.cs-success-title { font-family: "Bebas Neue", sans-serif; font-size: 28px; color: #22C55E; letter-spacing: 0.05em; }',
      '.cs-success-body { color: #7a87ab; font-size: 14px; line-height: 1.6; max-width: 360px; }',
      '.cs-success-again { margin-top: 8px; background: transparent; border: 1px solid #dde3f5; border-radius: 8px; color: #4a5680; cursor: pointer; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 600; padding: 10px 20px; transition: all 0.15s; }',
      '.cs-success-again:hover { border-color: #0060ff; color: #0060ff; }',
      '.cs-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px); background: #fff; border: 1px solid #dde3f5; border-radius: 10px; padding: 14px 20px; font-size: 14px; font-weight: 500; font-family: "DM Sans", sans-serif; opacity: 0; transition: all 0.3s; pointer-events: none; white-space: nowrap; max-width: calc(100vw - 48px); z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }',
      '.cs-toast-success { border-color: #22C55E; color: #22C55E; }',
      '.cs-toast-error { border-color: #EF4444; color: #EF4444; }',
      '.cs-toast-show { opacity: 1; transform: translateX(-50%) translateY(0); }',
      '.cs-access-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }',
      '.cs-access-btn { background: #f4f7ff; border: 1px solid #dde3f5; border-radius: 8px; color: #7a87ab; cursor: pointer; font-family: "DM Sans", sans-serif; padding: 12px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; transition: all 0.15s; }',
      '.cs-access-btn:hover { border-color: #b3c4f0; color: #080f24; }',
      '.cs-access-btn.cs-active { background: rgba(0,96,255,0.08); border-color: #0060ff; color: #0060ff; }',
      '.cs-access-label { font-size: 13px; font-weight: 600; }',
      '.cs-access-sub { font-size: 11px; color: #7a87ab; }',
      '.cs-access-btn.cs-active .cs-access-sub { color: #5580dd; }',
      '.cs-walkin-note { background: rgba(0,96,255,0.05); border: 1px solid rgba(0,96,255,0.15); border-radius: 8px; padding: 12px 14px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #4a5680; line-height: 1.5; }',
      '#court-submit-root textarea { background: #f4f7ff; border: 1px solid #dde3f5; border-radius: 8px; color: #080f24; font-family: "DM Sans", sans-serif; font-size: 15px; padding: 12px 14px; outline: none; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; }',
      '#court-submit-root textarea:focus { border-color: #0060ff; box-shadow: 0 0 0 3px rgba(0,96,255,0.2); }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Inject Fonts ────────────────────────────────────────────────────────────
  function cs_injectFonts() {
    if (document.querySelector('link[href*="Bebas+Neue"]')) return;
    var link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  // ── Build HTML ──────────────────────────────────────────────────────────────
  function cs_buildHTML(root) {
    root.innerHTML = [
      '<p class="cs-eyebrow">🏀 Proof of Play</p>',
      '<h1 class="cs-title">Add a<br><span>Court</span></h1>',
      '<p class="cs-subtitle">Know a court worth playing on? Add it to the database — no photo required. Courts go live immediately and earn you a badge once verified by our team.</p>',

      '<div class="cs-success" id="cs-success">',
        '<div class="cs-success-icon">🏀</div>',
        '<div class="cs-success-title">Court Added!</div>',
        '<div class="cs-success-body">The court is now live. You\'ll earn a badge once our team verifies your submission.</div>',
        '<button class="cs-success-again" onclick="resetCourtForm()">Add Another Court</button>',
      '</div>',

      '<form class="cs-form" id="cs-form" novalidate>',

        '<p class="cs-section">Court Info</p>',

        '<div class="cs-field" id="cs-field-court-name">',
          '<label class="cs-label">Court Name <span class="cs-req">*</span></label>',
          '<input type="text" id="cs-court-name" placeholder="e.g. Wicker Park Full Court" maxlength="80" autocomplete="off" />',
          '<span class="cs-err" id="cs-err-court-name"></span>',
        '</div>',

        '<div class="cs-field" id="cs-field-court-type">',
          '<label class="cs-label">Facilities <span class="cs-req">*</span></label>',
          '<p class="cs-hint">Select all that apply at this location</p>',
          '<div class="cs-toggle-row">',
            '<button type="button" class="cs-toggle-btn" data-value="Outdoor"><span class="cs-toggle-icon">☀️</span>Outdoor</button>',
            '<button type="button" class="cs-toggle-btn" data-value="Indoor"><span class="cs-toggle-icon">🏢</span>Indoor</button>',
            '<button type="button" class="cs-toggle-btn" data-value="Both"><span class="cs-toggle-icon">🏀</span>Both</button>',
'</div>',
        '<span class="cs-err" id="cs-err-court-type"></span>',
      '</div>',

      // ── ACCESS TYPE ──────────────────────────────────────────────────────
      '<div class="cs-field" id="cs-field-access-type">',
        '<label class="cs-label">Who can access this court? <span class="cs-req">*</span></label>',
        '<p class="cs-hint">Let players know before they show up</p>',
        '<div class="cs-access-row">',
          '<button type="button" class="cs-access-btn" data-access="public">',
            '<span class="cs-toggle-icon">🔓</span>',
            '<span class="cs-access-label">Public</span>',
            '<span class="cs-access-sub">Free, anyone can play</span>',
          '</button>',
          '<button type="button" class="cs-access-btn" data-access="walk_in">',
            '<span class="cs-toggle-icon">💰</span>',
            '<span class="cs-access-label">Walk-Ins Welcome</span>',
            '<span class="cs-access-sub">Drop-in fee applies</span>',
          '</button>',
          '<button type="button" class="cs-access-btn" data-access="members_only">',
            '<span class="cs-toggle-icon">🔑</span>',
            '<span class="cs-access-label">Members Only</span>',
            '<span class="cs-access-sub">Membership required</span>',
          '</button>',
          '<button type="button" class="cs-access-btn" data-access="restricted">',
            '<span class="cs-toggle-icon">🕐</span>',
            '<span class="cs-access-label">Restricted</span>',
            '<span class="cs-access-sub">Time/permit/conditions</span>',
          '</button>',
        '</div>',
        '<span class="cs-err" id="cs-err-access-type"></span>',
      '</div>',

      // Walk-in info (shown when walk_in selected)
      '<div class="cs-field cs-access-detail" id="cs-walkin-detail" style="display:none">',
        '<label class="cs-label">Walk-in pricing</label>',
        '<div class="cs-walkin-note">',
          '<span style="font-size:18px">💰</span>',
          '<span>Walk-in pricing varies. Players should <strong>call ahead</strong> or check the facility\'s website for current day-pass rates.</span>',
        '</div>',
      '</div>',

      // Restricted notes (shown when restricted selected, required)
      '<div class="cs-field cs-access-detail" id="cs-restricted-detail" style="display:none">',
        '<label class="cs-label">Access details <span class="cs-req">*</span></label>',
        '<textarea id="cs-access-notes" rows="3" placeholder="e.g. Open to public 6–9 PM weekdays only&#10;e.g. School court — permit required&#10;e.g. Must be 18+" style="resize:vertical"></textarea>',
        '<span class="cs-err" id="cs-err-access-notes"></span>',
      '</div>',
      // ── END ACCESS TYPE ──────────────────────────────────────────────────

      '<p class="cs-section">Location</p>',

        '<div class="cs-field">',
          '<label class="cs-label">Address <span class="cs-opt">(optional)</span></label>',
          '<input type="text" id="cs-address" placeholder="e.g. 3700 N Recreation Dr" />',
        '</div>',

        '<div class="cs-row-csz">',
          '<div class="cs-field" id="cs-field-city">',
            '<label class="cs-label">City <span class="cs-req">*</span></label>',
            '<input type="text" id="cs-city" placeholder="Chicago" />',
            '<span class="cs-err" id="cs-err-city"></span>',
          '</div>',
          '<div class="cs-field" id="cs-field-state">',
            '<label class="cs-label">State <span class="cs-req">*</span></label>',
            '<input type="text" id="cs-state" placeholder="IL" maxlength="50" />',
            '<span class="cs-err" id="cs-err-state"></span>',
          '</div>',
          '<div class="cs-field">',
            '<label class="cs-label">Zip <span class="cs-opt">(opt)</span></label>',
            '<input type="text" id="cs-zip" placeholder="60612" maxlength="10" />',
          '</div>',
        '</div>',

        '<div class="cs-field" id="cs-field-country">',
          '<label class="cs-label">Country <span class="cs-req">*</span></label>',
          '<input type="text" id="cs-country" placeholder="United States" value="United States" />',
          '<span class="cs-err" id="cs-err-country"></span>',
        '</div>',

        '<p class="cs-section">GPS Coordinates</p>',

        '<div class="cs-coords-box">',
          '<p class="cs-coords-note">Find the court on <a href="https://maps.google.com" target="_blank">Google Maps</a>, right-click the exact spot, and copy the coordinates at the top of the menu. Latitude first, then longitude (negative for US locations).</p>',
          '<div class="cs-row-2">',
            '<div class="cs-field" id="cs-field-latitude">',
              '<label class="cs-label">Latitude <span class="cs-req">*</span></label>',
              '<input type="number" id="cs-latitude" placeholder="41.9562" step="0.0001" min="-90" max="90" />',
              '<span class="cs-err" id="cs-err-latitude"></span>',
            '</div>',
            '<div class="cs-field" id="cs-field-longitude">',
              '<label class="cs-label">Longitude <span class="cs-req">*</span></label>',
              '<input type="number" id="cs-longitude" placeholder="-87.6383" step="0.0001" min="-180" max="180" />',
              '<span class="cs-err" id="cs-err-longitude"></span>',
            '</div>',
          '</div>',
        '</div>',

        '<p class="cs-section">Court Photo</p>',

        '<div class="cs-field">',
          '<label class="cs-label">Photo <span class="cs-opt">(optional)</span></label>',
          '<div class="cs-photo-drop" id="cs-photo-drop">',
            '<input type="file" id="cs-photo-file" accept="image/*" />',
            '<div id="cs-photo-content">',
              '<div class="cs-photo-icon">📸</div>',
              '<div class="cs-photo-text"><strong>Click to upload</strong> or drag &amp; drop<br>JPG, PNG, WEBP up to 10MB</div>',
            '</div>',
            '<img id="cs-photo-preview" alt="Court preview" />',
            '<div id="cs-photo-change">Tap to change photo</div>',
          '</div>',
          '<p class="cs-hint" style="margin-top:6px">Or paste a photo URL instead:</p>',
          '<input type="text" id="cs-photo-url" placeholder="https://example.com/court-photo.jpg" />',
        '</div>',

        '<div class="cs-divider" style="margin:8px 0"></div>',

        '<button type="submit" class="cs-submit-btn" id="cs-submit-btn">',
          '<span id="cs-btn-text">Submit Court</span>',
          '<div id="cs-spinner"></div>',
        '</button>',

        '<p class="cs-disclaimer">Courts go live immediately with verified = 0. You\'ll earn a badge once our team approves the submission.</p>',

      '</form>',
      '<div class="cs-toast" id="cs-toast"></div>'
    ].join('');
  }

  // ── Wire events ─────────────────────────────────────────────────────────────
function cs_wireEvents() {
    // Facility type toggles
    document.querySelectorAll('.cs-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.cs-toggle-btn').forEach(function(b) { b.classList.remove('cs-active'); });
        btn.classList.add('cs-active');
        cs_selectedType = btn.getAttribute('data-value');
        var err = document.getElementById('cs-err-court-type');
        if (err) err.style.display = 'none';
        var field = document.getElementById('cs-field-court-type');
        if (field) field.classList.remove('cs-invalid');
      });
    });

    // Access type buttons
    var cs_selectedAccess = '';
    document.querySelectorAll('.cs-access-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.cs-access-btn').forEach(function(b) { b.classList.remove('cs-active'); });
        btn.classList.add('cs-active');
        cs_selectedAccess = btn.getAttribute('data-access');
        document.getElementById('cs-walkin-detail').style.display    = cs_selectedAccess === 'walk_in'    ? '' : 'none';
        document.getElementById('cs-restricted-detail').style.display = cs_selectedAccess === 'restricted' ? '' : 'none';
        var err = document.getElementById('cs-err-access-type');
        if (err) err.style.display = 'none';
        var field = document.getElementById('cs-field-access-type');
        if (field) field.classList.remove('cs-invalid');
      });
    });

    window._cs_getAccessType  = function() { return cs_selectedAccess; };
    window._cs_getAccessNotes = function() {
      var el = document.getElementById('cs-access-notes');
      return el ? el.value.trim() : '';
    };

    // Photo file input
    var fileInput = document.getElementById('cs-photo-file');
    if (fileInput) {
      fileInput.addEventListener('change', function() { cs_handleFileSelect(this); });
    }

    // Drag & drop
    var drop = document.getElementById('cs-photo-drop');
    if (drop) {
      drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.style.borderColor = '#0060ff'; });
      drop.addEventListener('dragleave', function() { drop.style.borderColor = ''; });
      drop.addEventListener('drop', function(e) {
        e.preventDefault(); drop.style.borderColor = '';
        var file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          var dt = new DataTransfer(); dt.items.add(file);
          fileInput.files = dt.files;
          cs_handleFileSelect(fileInput);
        }
      });
    }

    // Form submit
    var form = document.getElementById('cs-form');
    if (form) form.addEventListener('submit', cs_handleSubmit);
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  function initCourtSubmit() {
    var root = document.getElementById('court-submit-root');
    if (!root) return;
    cs_injectFonts();
    cs_injectStyles();
    cs_buildHTML(root);
    cs_wireEvents();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCourtSubmit);
  } else {
    initCourtSubmit();
  }

})();
