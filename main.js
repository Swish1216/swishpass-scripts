// ========================================
// GLOBAL AUTH GUARD — runs on every page
// ========================================
const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
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

document.addEventListener("DOMContentLoaded", async function () {
  const path = window.location.pathname;
  const isPublic = PUBLIC_PATHS.some(p => path.includes(p));

  if (!isPublic) {
    const { data: { session } } = await window._supabase.auth.getSession();

    if (!session) {
      window.location.href = "/sign-in";
      return;
    }

    // Redirect incomplete onboarding
    const { data: player } = await window._supabase
      .from("Players")
      .select("Username, Position")
      .eq("auth_user_id", session.user.id)
      .single();

    if (!player || !player.Username) {
      window.location.href = "/username-setup";
      return;
    }

    if (!player.Position) {
      window.location.href = "/profile-setup";
      return;
    }
  }

  // Page routing
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

  // Always run autofill on every page
  autofillUser();
});

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
  var countries = [...new Set(allData.map(function(p) { return p.Country; }).filter(Boolean))].sort();
  var states = [...new Set(allData.map(function(p) { return p['State/Province']; }).filter(Boolean))].sort();
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
    + '<div style="padding:0 16px;overflow-x:auto;-webkit-overflow-scrolling:touch;">'
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
    return '<div style="display:flex;align-items:flex-start;gap:16px;padding:16px;border-bottom:1px solid #f0f0f0;">'
      + '<a href="' + (b.URL || '#') + '" target="_blank" style="flex-shrink:0;">'
      + '<img src="' + (b['Badge Image URL'] || '') + '" alt="' + b.Name + '" style="width:64px;height:64px;object-fit:contain;border-radius:8px;background:#f5f5f5;" />'
      + '</a>'
      + '<div style="flex:1;">'
      + '<p style="font-size:15px;font-weight:500;color:#111;margin:0 0 4px;">' + b.Name + '</p>'
      + '<p style="font-size:13px;color:#555;margin:0 0 6px;">' + (b.Notes || '') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0 0 2px;">Start: ' + (b['Start Date'] || 'N/A') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0 0 2px;">End: ' + (b['End Date'] || 'N/A') + '</p>'
      + '<p style="font-size:12px;color:#888;margin:0;">Season: ' + (b.Season || 'N/A') + '</p>'
      + '</div>'
      + '<a href="' + (b.URL || '#') + '" target="_blank" style="font-size:12px;color:#555;text-decoration:none;white-space:nowrap;align-self:center;padding:6px 12px;border:1px solid #ddd;border-radius:6px;">View →</a>'
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
  var search = document.getElementById('courts-search') ? document.getElementById('courts-search').value.toLowerCase() : '';
  var city = document.getElementById('courts-city') ? document.getElementById('courts-city').value : '';
  var state = document.getElementById('courts-state') ? document.getElementById('courts-state').value : '';
  var type = document.getElementById('courts-type') ? document.getElementById('courts-type').value : '';
  var verified = document.getElementById('courts-verified') ? document.getElementById('courts-verified').value : '';
  var result = await window._supabase
    .from('Courts')
    .select('"Court ID", "Court Name", "Address", "City", "State", "Zip Code", "Country", "Indoor or Outdoor", "Verified?"')
    .order('"Court Name"', { ascending: true });
  var data = result.data;
  var error = result.error;
  if (error) { console.error(error); return; }
  var allData = data;
  if (search) {
    data = data.filter(function(c) {
      return (c['Court Name'] || '').toLowerCase().includes(search)
        || (c['Address'] || '').toLowerCase().includes(search)
        || (c['City'] || '').toLowerCase().includes(search);
    });
  }
  if (city) data = data.filter(function(c) { return c.City === city; });
  if (state) data = data.filter(function(c) { return c.State === state; });
  if (type) data = data.filter(function(c) { return c['Indoor or Outdoor'] === type; });
  if (verified !== '') data = data.filter(function(c) { return c['Verified?'] === parseInt(verified); });
  var cities = [...new Set(allData.map(function(c) { return c.City; }).filter(Boolean))].sort();
  var states = [...new Set(allData.map(function(c) { return c.State; }).filter(Boolean))].sort();
  var types = [...new Set(allData.map(function(c) { return c['Indoor or Outdoor']; }).filter(Boolean))].sort();
  var rows = data.map(function(c) {
    var verifiedBadge = c['Verified?'] === 1
      ? '<span style="padding:2px 8px;background:#e6f4ea;color:#2d7a3a;border-radius:4px;font-size:11px;font-weight:500;">Verified</span>'
      : '<span style="padding:2px 8px;background:#f5f5f5;color:#888;border-radius:4px;font-size:11px;">Unverified</span>';
    return '<tr style="border-bottom:1px solid #f5f5f5;">'
      + '<td style="padding:12px 8px;color:#111;font-weight:500;">' + (c['Court Name'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['Address'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['City'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['State'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['Zip Code'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['Country'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;color:#555;">' + (c['Indoor or Outdoor'] || 'N/A') + '</td>'
      + '<td style="padding:12px 8px;">' + verifiedBadge + '</td>'
      + '</tr>';
  }).join('');
  var cityOptions = cities.map(function(c) {
    return '<option value="' + c + '" ' + (c === city ? 'selected' : '') + '>' + c + '</option>';
  }).join('');
  var stateOptions = states.map(function(s) {
    return '<option value="' + s + '" ' + (s === state ? 'selected' : '') + '>' + s + '</option>';
  }).join('');
  var typeOptions = types.map(function(t) {
    return '<option value="' + t + '" ' + (t === type ? 'selected' : '') + '>' + t + '</option>';
  }).join('');
  container.innerHTML = ''
    + '<div style="padding:0 16px;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Court Directory</h2>'
    + '<div style="display:flex;gap:10px;margin-bottom:1rem;flex-wrap:wrap;">'
    + '<input id="courts-search" type="text" placeholder="Search courts..." value="' + search + '" oninput="loadCourts()" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;" />'
    + '<select id="courts-city" onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">City</option>' + cityOptions + '</select>'
    + '<select id="courts-state" onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">State</option>' + stateOptions + '</select>'
    + '<select id="courts-type" onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;"><option value="">Indoor/Outdoor</option>' + typeOptions + '</select>'
    + '<select id="courts-verified" onchange="loadCourts()" style="padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;color:#111;background:#fff;">'
    + '<option value="">All Courts</option>'
    + '<option value="1" ' + (verified === '1' ? 'selected' : '') + '>Verified Only</option>'
    + '<option value="0" ' + (verified === '0' ? 'selected' : '') + '>Unverified Only</option>'
    + '</select>'
    + '</div>'
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;display:block;">'
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
      + '<span style="font-size:12px;color:#888;">' + (post.Date || 'N/A') + '</span>'
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
        ? '<button onclick="event.preventDefault();event.stopPropagation();sendFriendRequest(' + p.player_id + ', \'' + (p.Username || '') + '\', this)" style="padding:8px 14px;background:#378add;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;white-space:nowrap;">Add Friend</button>'
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
window.addEventListener('load', async function() {
  if (!document.getElementById('verify-sessions-container')) return;

  // REPLACED: was window.$memberstackDom block
  var player = await getCurrentPlayer();
  currentPlayerEmail = player.email;
  currentPlayerProfileNumber = player.playerId;

  window.loadVerifySessions();
});

window.loadVerifySessions = async function() {
  var container = document.getElementById('verify-sessions-container');
  if (!container) return;

  if (!currentPlayerProfileNumber) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">You must be logged in to verify sessions.</p>';
    return;
  }

  var mySessionsResult = await window._supabase
    .from('Sessions Forms')
    .select('"Session ID", court_id, "Start Time", "End Time"')
    .eq('player_id', currentPlayerProfileNumber)
    .not('"End Time"', 'is', null);

  var mySessions = mySessionsResult.data || [];

  if (mySessions.length === 0) {
    container.innerHTML = ''
      + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
      + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Verify Sessions</h2>'
      + '<p style="color:#888;font-size:14px;">You need to complete at least one session before you can verify other players\' sessions.</p>'
      + '</div>';
    return;
  }

  var myVerificationsResult = await window._supabase
    .from('Verifications')
    .select('session_id')
    .eq('verifier_id', currentPlayerProfileNumber);

  var alreadyVerifiedIds = (myVerificationsResult.data || []).map(function(v) { return v.session_id; });

  var courtIds = [...new Set(mySessions.map(function(s) { return s.court_id; }))];

  var threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  var eligibleResult = await window._supabase
    .from('Sessions Forms')
    .select('"Session ID", player_id, player_username, court_id, "Start Time", "End Time", "Images", "Verified? or Review?"')
    .in('court_id', courtIds)
    .not('"End Time"', 'is', null)
    .gte('"End Time"', threeDaysAgo.toISOString())
    .neq('player_id', currentPlayerProfileNumber)
    .order('"Start Time"', { ascending: false });

  var candidateSessions = eligibleResult.data || [];

  var eligibleSessions = candidateSessions.filter(function(theirSession) {
    if (alreadyVerifiedIds.indexOf(theirSession['Session ID']) !== -1) return false;

    var theirStart = new Date(theirSession['Start Time']);
    var theirEnd = new Date(theirSession['End Time']);

    return mySessions.some(function(mySession) {
      if (mySession.court_id !== theirSession.court_id) return false;
      var myStart = new Date(mySession['Start Time']);
      var myEnd = new Date(mySession['End Time']);
      return myStart < theirEnd && theirStart < myEnd;
    });
  });

  var courtsResult = await window._supabase
    .from('Courts')
    .select('"Court ID", "Court Name"')
    .in('"Court ID"', courtIds);

  var courtMap = {};
  (courtsResult.data || []).forEach(function(c) { courtMap[c['Court ID']] = c['Court Name']; });

  if (eligibleSessions.length === 0) {
    container.innerHTML = ''
      + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
      + '<h2 style="font-size:22px;font-weight:500;margin-bottom:1.25rem;color:#111;">Verify Sessions</h2>'
      + '<p style="color:#888;font-size:14px;">No sessions available for you to verify right now. Sessions appear here when you were at the same court at the same time as another player.</p>'
      + '</div>';
    return;
  }

  var cards = eligibleSessions.map(function(s) {
    var qualifyingSession = mySessions.find(function(mine) {
      if (mine.court_id !== s.court_id) return false;
      var myStart = new Date(mine['Start Time']);
      var myEnd = new Date(mine['End Time']);
      var theirStart = new Date(s['Start Time']);
      var theirEnd = new Date(s['End Time']);
      return myStart < theirEnd && theirStart < myEnd;
    });

    var courtName = courtMap[s.court_id] || 'Court ' + s.court_id;
    var image = s.Images
      ? '<img src="' + s.Images + '" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;display:block;margin-bottom:12px;" />'
      : '';

    return '<div style="border:1px solid #eee;border-radius:12px;padding:16px;background:#fff;margin-bottom:14px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
      + '<p style="font-size:15px;font-weight:500;color:#111;margin:0;">' + (s.player_username || 'Player ' + s.player_id) + '</p>'
      + '<span style="font-size:12px;color:#888;">' + courtName + '</span>'
      + '</div>'
      + '<p style="font-size:12px;color:#888;margin:0 0 12px;">' + s['Start Time'] + ' — ' + s['End Time'] + '</p>'
      + image
      + '<div style="display:flex;gap:8px;">'
      + '<button onclick="submitVerification(\'' + s['Session ID'] + '\', \'' + qualifyingSession['Session ID'] + '\', \'confirmed\')" style="flex:1;padding:10px 16px;background:#2d7a3a;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">✓ Confirm</button>'
      + '<button onclick="submitVerification(\'' + s['Session ID'] + '\', \'' + qualifyingSession['Session ID'] + '\', \'disputed\')" style="flex:1;padding:10px 16px;background:#fff;color:#e24b4a;border:1px solid #e24b4a;border-radius:6px;font-size:13px;cursor:pointer;font-weight:500;">✗ Dispute</button>'
      + '</div>'
      + '</div>';
  }).join('');

  container.innerHTML = ''
    + '<div style="padding:0 16px;max-width:640px;margin:0 auto;">'
    + '<h2 style="font-size:22px;font-weight:500;margin-bottom:8px;color:#111;">Verify Sessions</h2>'
    + '<p style="font-size:13px;color:#888;margin-bottom:1.25rem;">These sessions overlapped with yours at the same court. Confirm if you actually saw them play, or dispute if you didn\'t.</p>'
    + cards
    + '</div>';
};

window.submitVerification = async function(sessionId, verifierSessionId, vote) {
  if (!currentPlayerProfileNumber) { alert('You must be logged in.'); return; }

  var confirmMsg = vote === 'confirmed'
    ? 'Confirm you saw this player at this session?'
    : 'Dispute this session? This should only be used if you were there and did NOT see this player.';

  if (!confirm(confirmMsg)) return;

  var result = await window._supabase
    .from('Verifications')
    .insert({
      session_id: sessionId,
      verifier_id: currentPlayerProfileNumber,
      verifier_session_id: verifierSessionId,
      vote: vote
    });

  if (result.error) {
    console.error(result.error);
    alert('Error submitting verification. Please try again.');
    return;
  }

  window.loadVerifySessions();
};



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
    + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;">'
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
    .select('"Court ID", "Court Name", "Address", "City", "State", "Country"')
    .order('"Court Name"', { ascending: true });

  var courts = courtsResult.data || [];

  var activeSessionsResult = await window._supabase
    .from('Sessions Forms')
    .select('court_id')
    .is('"End Time"', null);

  var activeSessions = activeSessionsResult.data || [];

  var activeCounts = {};
  activeSessions.forEach(function(s) {
    activeCounts[s.court_id] = (activeCounts[s.court_id] || 0) + 1;
  });

  window.liveCourtFeedData = courts.map(function(c) {
    return {
      courtId: c['Court ID'],
      courtName: c['Court Name'],
      address: c['Address'],
      city: c['City'],
      state: c['State'],
      country: c['Country'],
      activeCount: activeCounts[c['Court ID']] || 0
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
    return '<div style="border-radius:12px;overflow:hidden;border:1px solid #eee;background:#fff;">'
      + '<div style="position:relative;">'
      + '<img src="' + (post.Attachments || '') + '" style="width:100%;max-height:500px;object-fit:cover;display:block;" />'
      + '<span style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.6);color:#fff;font-size:13px;padding:5px 12px;border-radius:20px;font-weight:500;">' + (post.Players || '') + '</span>'
      + '</div>'
      + '<div style="padding:16px 18px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:10px;">'
      + '<span style="font-size:12px;color:#888;">' + (post.Date || 'N/A') + '</span>'
      + '<span style="font-size:12px;color:#888;">' + (post['Court Name'] || 'N/A') + '</span>'
      + '</div>'
      + (post.Post ? '<p style="font-size:15px;color:#111;margin:0;line-height:1.5;">' + post.Post + '</p>' : '')
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
    .select('"id", "group_name"')
    .eq('group_number', groupNumber)
    .limit(1);

  if (!groupResult.data || groupResult.data.length === 0) {
    container.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Group not found.</p>';
    return;
  }

  var groupId = groupResult.data[0].id;
  var groupName = groupResult.data[0].group_name;

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
    .select('"id"')
    .eq('group_number', groupNumber)
    .limit(1);

  if (!groupResult.data || groupResult.data.length === 0) {
    document.getElementById('sf-group-container').innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Group not found.</p>';
    return;
  }

  var groupId = groupResult.data[0].id;

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
      + '<span style="font-size:12px;color:#888;">' + (post.Date || 'N/A') + '</span>'
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
      Tier: 'Rookie'
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
      background: #000;
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

  container.innerHTML = `
    <div class="pop-form">
      <h2 class="pop-title">Welcome back</h2>
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

    window.location.href = "/sp-home";
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
  const isMember = !!myMembership;
  const canJoin  = !isMember && !group.is_private && player.playerId;

  // Build members list HTML
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
            <span style="padding:2px 8px;background:${group.is_private ? '#f5f5f5' : '#e6f4ea'};color:${group.is_private ? '#888' : '#2d7a3a'};border-radius:4px;font-size:11px;font-weight:500;">${group.is_private ? 'Private' : 'Public'}</span>
          </div>
        </div>
      </div>

      <!-- Description -->
      ${group.description ? `<p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6;padding:14px 16px;background:#fafafa;border-radius:8px;border:1px solid #eee;">${group.description}</p>` : ''}

      <!-- Join Button (public, non-member) -->
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
            <input
              data-group="add-member-search"
              type="text"
              placeholder="Search by username..."
              style="width:100%;padding:10px 14px;font-size:14px;border:1px solid #ddd;border-radius:8px;box-sizing:border-box;color:#111;font-family:inherit;"
            />
            <div data-group="add-member-results" style="margin-top:10px;display:flex;flex-direction:column;gap:8px;"></div>
            <p data-group="add-member-error" style="color:#e24b4a;font-size:13px;margin:8px 0 0;min-height:16px;"></p>
          </div>
        </div>
      ` : ''}

      <!-- Transfer Ownership Panel (hidden until needed) -->
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

      <!-- Owner + Member Actions -->
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

    </div>
  `;

  // Wire up remove buttons
  container.querySelectorAll('[data-action="remove-member"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetPlayerId = parseInt(btn.dataset.playerId);
      await removeMemberFromGroup(group.id, targetPlayerId, group.group_number);
    });
  });

  // Wire up join button
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

  // Wire up add member search
  if (isOwner) initAddMember(group.id, members.map(m => m.player_id));

  // Wire up leave button
  const leaveBtn = container.querySelector('[data-action="leave-group"]');
  if (leaveBtn && isMember) {
    leaveBtn.addEventListener('click', () => leaveGroup(group, members, player.playerId));
  }

  // Wire up delete button
  const deleteBtn = container.querySelector('[data-action="delete-group"]');
  if (deleteBtn && isOwner) {
    deleteBtn.addEventListener('click', () => deleteGroup(group));
  }
}
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
