let opened_tab = null;
let controlpanel_run = null;
let localroutes_run = null;
let domainsroutes_run = null;
let page_ip = null;
let page_ip_all = new Array();
let routes_query = '';
let routes_mangle_query = '';
let routes_mangle = new Array();
let domains_query = '';
let domains_mangle_query = '';
let domains_mangle = new Array();
let domains_regular = ',';
let exclude_minprefix = 32;
let exclude_maxprefix = 0;
let notrouted_minprefix = 32;
let notrouted_maxprefix = 0;
let local_storage = null;

async function InitPage()
{
  try {
    local_storage = (window.browser ? browser.storage : chrome.storage);
  } catch {}
  
  let load_settings = null;
  
  if (local_storage !== null)
    await local_storage.local.get(["MikroTikControlPanelSettings"]).then((result) => {
      if (typeof result.MikroTikControlPanelSettings != 'undefined')
        load_settings = result.MikroTikControlPanelSettings;
    });
  else
    document.getElementById("save-button").disabled = true;
  
  if (load_settings !== null) {
    if (typeof load_settings['defaults']['userip'] == 'undefined')
      load_settings['defaults']['userip'] = false;
    if (typeof load_settings['defaults']['updates'] == 'undefined')
      load_settings['defaults']['updates'] = true;
    if (typeof load_settings['defaults']['myip'] == 'undefined')
      load_settings['defaults']['myip'] = 1;
    if (typeof load_settings['defaults']['whois'] == 'undefined')
      load_settings['defaults']['whois'] = 1;
    
    settings['localhost'] = load_settings['localhost'];
    settings['user'] = DecodeString(load_settings['an']);
    settings['password'] = DecodeString(load_settings['ap']);
    settings['router'] = load_settings['router'];
    settings['protocol'] = load_settings['protocol'];
    settings['defaults'] = load_settings['defaults'];
  } else {
    if ((typeof settings['user'] == 'undefined' || !settings['user']) && typeof settings['an'] != 'undefined' && settings['an'])
      settings['user'] = ae(settings['an']);
    if ((typeof settings['password'] == 'undefined' || !settings['password']) && typeof settings['ap'] != 'undefined' && settings['ap'])
      settings['password'] = ae(settings['ap']);
  }
  
  for (let subnet in settings['exclude']) {
    if (settings['exclude'][subnet] > exclude_maxprefix)
      exclude_maxprefix = settings['exclude'][subnet];
    if (settings['exclude'][subnet] < exclude_minprefix)
      exclude_minprefix = settings['exclude'][subnet];
  }
  
  for (let subnet in settings['notrouted']) {
    if (settings['notrouted'][subnet] > notrouted_maxprefix)
      notrouted_maxprefix = settings['notrouted'][subnet];
    if (settings['notrouted'][subnet] < notrouted_minprefix)
      notrouted_minprefix = settings['notrouted'][subnet];
  }
  
  document.getElementById("router-address").value = settings['router'];
  document.getElementById("router-user").value = settings['user'];
  document.getElementById("router-password").value = settings['password'];
  document.getElementById("protocol-selection").value = settings['protocol'];
  document.getElementById("domain-dynamic").checked = settings['defaults']['dynamic'];
  document.getElementById("domain-time").value = settings['defaults']['time'];
  document.getElementById("domain-" + settings['defaults']['how']).checked = true;
  document.getElementById("domain-" + settings['defaults']['what']).checked = true;
  document.getElementById("top-domains").value = settings['defaults']['www'];
  document.getElementById("localip-byuser").checked = settings['defaults']['userip'];
  document.getElementById("page-allip").checked = settings['defaults']['allip'];
  document.getElementById("check-updates").checked = settings['defaults']['updates'];
  
  let routes_options = '';
  let domains_options = '';
  let api_myip_options = '';
  let api_whois_options = '';
  
  for (let idx in settings['routes']) {
    routes_options += '<option value="' + settings['routes'][idx] + '">' + idx + '</option>';
    
    if (settings['routes'][idx])
    {
      routes_query += '"list=' + settings['routes'][idx] + '",' + (routes_query ? '"#|",' : '');
      routes_mangle_query += '"src-address-list=' + settings['routes'][idx] + '",' + (routes_mangle_query ? '"#|",' : '');
    }
  }
  
  for (let idx in settings['domains']) {
    domains_options += '<option value="' + settings['domains'][idx] + '">' + idx + '</option>';
    
    domains_regular += settings['domains'][idx] + ',';
    
    if (settings['domains'][idx])
    {
      domains_query += '"list=' + settings['domains'][idx] + '",' + (domains_query ? '"#|",' : '');
      domains_mangle_query += '"dst-address-list=' + settings['domains'][idx] + '",' + (domains_mangle_query ? '"#|",' : '');
    }
  }
  
  for (let i = 0; i < settings['api']['myip'].length; i++) {
    api_myip_options += '<option value="' + i + '"' + (settings['defaults']['myip'] == i ? ' selected' : '') + '>' + settings['api']['myip'][i]['name'] + '</option>';
  }
  
  for (let i = 0; i < settings['api']['whois'].length; i++) {
    api_whois_options += '<option value="' + i + '"' + (settings['defaults']['whois'] == i ? ' selected' : '') + '>' + settings['api']['whois'][i]['name'] + '</option>';
  }
  
  document.getElementById("route-selection").innerHTML = routes_options;
  document.getElementById("domain-selection").innerHTML = domains_options;
  document.getElementById("api-myip-selection").innerHTML = api_myip_options;
  document.getElementById("api-whois-selection").innerHTML = api_whois_options;
  
  document.getElementById("settings-button").addEventListener("click", () => {
    HideViewBlock('settings-block');
  });
  
  let authuser = 'Basic ' + btoa(settings['user'] + ":" + settings['password']);
  
  fetch(settings['protocol'] + "://" + settings['router'] + "/rest/ip/firewall/mangle/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + routes_mangle_query + ',"disabled=false","chain=prerouting","action=route","action=mark-routing","#|"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    for (let i = 0; i < data.length; i++)
      routes_mangle[data[i]['src-address-list']] = i;
    
    if (settings['defaults']['userip'])
    {
      fetch(settings['protocol'] + "://" + settings['router'] + "/rest/user/active/print", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
        body: '{".query": ["name=' + settings['user'] + '","via=(unknown)"]}'
      }).then((response) => { return response.json(); }).then((data2) => {
        if (data2.length)
        {
          document.getElementById("local-address").value = data2[data2.length - 1]['address'];
          
          RefreshLocalhostRoute();
        }
      }).catch(function() {
        SetRouterApiError();
      });
    }
    else
    {
      document.getElementById("local-address").value = settings['localhost'];
      
      RefreshLocalhostRoute();
    }
  }).catch(function() {
    SetRouterApiError();
  });
  
  RefreshAddressInfo();
  
  chrome.tabs.query({active: true}, async (tabs) => {
    const tab = tabs[0];
    if (tab && tab['url'] !== undefined) {
      opened_tab = tab;
      const url = new URL(tab.url);
      const hostname = url.hostname;
      document.getElementById("current-page").innerHTML = hostname;
      
      if (hostname.indexOf('.') > 0) {
        page_ip_all = await GetHostsFromRouter(hostname, 'temporary-' + settings['user'], settings['protocol'] + "://" + settings['router'], authuser);
        
        if (page_ip_all.length)
          page_ip = page_ip_all[0];
        
        if (page_ip)
        {
          if (settings['defaults']['allip'])
          {
            let page_addresses = page_ip;
            for (let i = 1; i < page_ip_all.length; i++)
              page_addresses += '<br>' + page_ip_all[i];
            document.getElementById("page-address").innerHTML = page_addresses;
          }
          else
            document.getElementById("page-address").innerHTML = page_ip;
          
          let disabled_button = true;
          for (let i = 0; i < page_ip_all.length; i++)
          {
            if (!IpIsExclude(page_ip_all[i]))
            {
              disabled_button = false;
              break;
            }
          }
          document.getElementById("domain-button").disabled = disabled_button;
          
          if (settings['defaults']['whois'])
          {
            let headers = { "Accept": "*/*" };
            
            if (typeof settings['api']['whois'][settings['defaults']['whois']]['authorization'] != 'undefined' && settings['api']['whois'][settings['defaults']['whois']]['authorization'])
              headers['Authorization'] = settings['api']['whois'][settings['defaults']['whois']]['authorization'];
            
            fetch(settings['api']['whois'][settings['defaults']['whois']]['request'].replaceAll('[%ip%]', page_ip), {
              method: "GET",
              headers: headers
            }).then((response) => {
              if (response.status == 200)
              {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") >= 0)
                  return response.json();
                
                return response.text();
              }
            }).then((answer) => {
              if (typeof answer == 'object')
                document.getElementById("page-info").innerHTML = ReplaceAnswerObjects(settings['api']['whois'][settings['defaults']['whois']]['page'], answer, 'answer.');
              else if (typeof answer == 'string')
                document.getElementById("page-info").innerHTML = settings['api']['whois'][settings['defaults']['whois']]['page'].replaceAll('[%answer%]', answer);
            }).catch(function() {
              document.getElementById("error-messages").innerHTML += "<b>Error connecting to external API</b><br>Check availability " + settings['api']['whois'][settings['defaults']['whois']]['name'];
            });
          }
        }
        else
        {
          document.getElementById("domain-address").disabled = true;
          document.getElementById("domain-name").checked = true;
        }
        
        fetch(settings['protocol'] + "://" + settings['router'] + "/rest/ip/firewall/mangle/print", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
          body: '{".query": [' + domains_mangle_query + ',"disabled=false","chain=prerouting","action=route","action=mark-routing","#|"]}'
        }).then((response) => { return response.json(); }).then((data) => {
          for (let i = 0; i < data.length; i++)
            domains_mangle[data[i]['dst-address-list']] = i;
          
          RefreshPageInfo();
        }).catch(function() {
          SetRouterApiError();
        });
      } else {
        document.getElementById("domain-button").disabled = true;
      }
    } else {
      document.getElementById("domain-button").disabled = true;
    }
  });
  
  document.getElementById("controlpanel-button").addEventListener("click", () => {
    HideViewControlPanel();
  });
  
  document.getElementById("localroutes-button").addEventListener("click", () => {
    HideViewLocalRoutes();
  });
  
  document.getElementById("domainsroutes-button").addEventListener("click", () => {
    HideViewDomainsRoutes();
  });
  
  document.getElementById("local-address").addEventListener("keyup", (evt) => {
    OnKeyUpLocalhostIP(evt);
  });
  
  document.getElementById("page-allip").addEventListener("change", () => {
    ShowAllPageIP();
  });
  
  document.getElementById("route-button").addEventListener("click", () => {
    SetLocalhostRoute();
  });
  
  document.getElementById("domain-button").addEventListener("click", () => {
    SetPageRoute();
  });
  
  document.getElementById("save-button").addEventListener("click", () => {
    SaveSettings();
  });
}

function HideViewBlock(block_name)
{
  let info_block = document.getElementById(block_name);
  info_block.hidden = !info_block.hidden;
}

function ShowAllPageIP()
{
  if (document.getElementById("page-allip").checked)
  {
    let page_addresses = page_ip;
    for (let i = 1; i < page_ip_all.length; i++)
      page_addresses += '<br>' + page_ip_all[i];
    document.getElementById("page-address").innerHTML = page_addresses;
  }
  else
    document.getElementById("page-address").innerHTML = page_ip;
}

function SetRouterApiError()
{
  document.getElementById("error-messages").innerHTML = "<b>Error connecting to router API</b><br>Check router address, username,<br>password and protocol in settings";
  document.getElementById("route-button").disabled = true;
  document.getElementById("domain-button").disabled = true;
}

function OnKeyUpLocalhostIP(evt)
{
  if (evt.key == 'Enter')
    RefreshLocalhostRoute();
}

function RefreshLocalhostRoute()
{
  let localhost = document.getElementById("local-address").value;
  let router = document.getElementById("router-address").value;
  let username = document.getElementById("router-user").value;
  let userpass = document.getElementById("router-password").value;
  let protocol = document.getElementById("protocol-selection").value;
  let authuser = 'Basic ' + btoa(username + ":" + userpass);
  
  fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + routes_query + '"address=' + localhost + '","disabled=false"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    let active_list = null;
    for (let i = 0; i < data.length; i++)
      if (active_list === null || routes_mangle[data[i]['list']] < routes_mangle[active_list])
        active_list = data[i]['list'];
    
    document.getElementById("route-selection").value = (active_list !== null ? active_list : '');
  }).catch(function() {
    SetRouterApiError();
  });
}

function RefreshAddressInfo()
{
  let api_myip_select = parseInt(document.getElementById("api-myip-selection").value);
  let api_whois_select = parseInt(document.getElementById("api-whois-selection").value);
  
  document.getElementById("current-address").innerHTML = settings['api']['myip'][0]['result'];
  document.getElementById("address-info").innerHTML = settings['api']['whois'][0]['result'];
  
  if (api_myip_select)
  {
    let headers = { "Accept": "*/*" };
    
    if (typeof settings['api']['myip'][api_myip_select]['authorization'] != 'undefined' && settings['api']['myip'][api_myip_select]['authorization'])
      headers['Authorization'] = settings['api']['myip'][api_myip_select]['authorization'];
    
    fetch(settings['api']['myip'][api_myip_select]['request'], {
      method: "GET",
      headers: headers
    }).then((response) => {
      if (response.status == 200)
      {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") >= 0)
          return response.json();
        
        return response.text();
      }
    }).then((answer) => {
      let api_myip = null;
      
      if (typeof answer == 'object')
        api_myip = ReplaceAnswerObjects(settings['api']['myip'][api_myip_select]['result'], answer, 'answer.');
      else if (typeof answer == 'string')
        api_myip = settings['api']['myip'][api_myip_select]['result'].replaceAll('[%answer%]', answer);
      
      if (api_myip)
      {
        document.getElementById("current-address").innerHTML = api_myip;
        
        if (api_whois_select)
        {
          let headers2 = { "Accept": "*/*" };
          
          if (typeof settings['api']['whois'][api_whois_select]['authorization'] != 'undefined' && settings['api']['whois'][api_whois_select]['authorization'])
            headers2['Authorization'] = settings['api']['whois'][api_whois_select]['authorization'];
          
          fetch(settings['api']['whois'][api_whois_select]['request'].replaceAll('[%ip%]', api_myip), {
            method: "GET",
            headers: headers2
          }).then((response) => {
            if (response.status == 200)
            {
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.indexOf("application/json") >= 0)
                return response.json();
              
              return response.text();
            }
          }).then((answer2) => {
            if (typeof answer2 == 'object')
              document.getElementById("address-info").innerHTML = ReplaceAnswerObjects(settings['api']['whois'][api_whois_select]['result'], answer2, 'answer.');
            else if (typeof answer2 == 'string')
              document.getElementById("address-info").innerHTML = settings['api']['whois'][api_whois_select]['result'].replaceAll('[%answer%]', answer2);
          }).catch(function() {
            document.getElementById("error-messages").innerHTML = "<b>Error connecting to external API</b><br>Check availability " + settings['api']['whois'][api_whois_select]['name'];
          });
        }
      }
    }).catch(function() {
      document.getElementById("error-messages").innerHTML = "<b>Error connecting to external API</b><br>Check availability " + settings['api']['myip'][api_myip_select]['name'];
    });
  }
}

function ReplaceAnswerObjects(str, obj, pref)
{
  for (let idx in obj)
    if (typeof obj[idx] == 'object')
      str = ReplaceAnswerObjects(str, obj[idx], pref + idx + '.');
    else if (typeof obj[idx] == 'boolean')
      str = str.replaceAll('[%' + pref + idx + '%]', (obj[idx] ? "Yes" : "No"));
    else
      str = str.replaceAll('[%' + pref + idx + '%]', obj[idx]);
  
  return str;
}

async function GetHostsFromRouter(hostname, listname, router_url, authuser)
{
  let addresses = new Array();
  
  if ((/^(\d{1,3}\.){3}\d{1,3}$/).test(hostname))
    addresses.push(hostname);
  else
  {
    await fetch(router_url + "/rest/ip/firewall/address-list/add", {
      method: 'POST',
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{"address":"' + hostname + '","disabled":"false","dynamic":"true","timeout":"00:00:05","list":"' + listname + '"}'
    }).then(async (response) => {
      let hostlist_id = null;
      let k = settings['tweaks']['router_gethosts_await_tries'];
      
      if (response.status == 200)
      {
        hostlist_id = await response.json();
        await delay(settings['tweaks']['router_gethosts_await_ms']);
      }
      
      while (k)
      {
        k--;
        
        await fetch(router_url + "/rest/ip/firewall/address-list/print", {
          method: 'POST',
          headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
          body: '{".query": ["comment=' + hostname + '","disabled=false","list=' + listname + '"]}'
        }).then(async (response) => {
          return response.json();
        }).then(async (data) => {
          for (let i = 0; i < data.length; i++)
            addresses.push(data[i]['address']);
        }).catch(function() {
          if (!k)
            SetRouterApiError();
        });
        
        if (addresses.length)
          break;
        
        if (k)
          await delay(settings['tweaks']['router_gethosts_await_ms']);
      }
      
      if (hostlist_id && hostlist_id.ret)
        fetch(router_url + "/rest/ip/firewall/address-list/" + hostlist_id.ret, {
          method: 'DELETE',
          headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser }
        });
    }).catch(function() {
      SetRouterApiError();
    });
  }
  
  return addresses;
}

async function SetLocalhostRoute()
{
  let localhost = document.getElementById("local-address").value.replaceAll(' ', '');
  let addrlist = document.getElementById("route-selection").value;
  let address = document.getElementById("page-address").innerHTML;
  let domain = document.getElementById("current-page").innerHTML;
  let router = document.getElementById("router-address").value.replaceAll(' ', '');
  let username = document.getElementById("router-user").value;
  let userpass = document.getElementById("router-password").value;
  let protocol = document.getElementById("protocol-selection").value;
  let api_myip_select = parseInt(document.getElementById("api-myip-selection").value);
  let api_whois_select = parseInt(document.getElementById("api-whois-selection").value);
  let authuser = 'Basic ' + btoa(username + ":" + userpass);
  let is_exclude = (!address || address == '-' || IpIsExclude(address));
  let disable_from = 0;
  let api_myip_url = null;
  let api_whois_url = null;
  let do_delay = false;
  
  let current_list = await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + routes_query + '"address=' + localhost + '"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    return data;
  });
  
  let current_conn_query = "";
  if (!is_exclude)
    current_conn_query += '"dst-address=' + address + ':443","dst-address=' + address + ':80","#|"';
  
  if (api_myip_select)
  {
    api_myip_url = new URL(settings['api']['myip'][api_myip_select]['request']);
    
    if (api_myip_url.hostname)
    {
      let api_addresses = await GetHostsFromRouter(api_myip_url.hostname, 'temporary-' + username, protocol + "://" + router, authuser);
      
      for (let i = 0; i < api_addresses.length; i++)
        current_conn_query += '"dst-address=' + api_addresses[i] + ':443","dst-address=' + api_addresses[i] + ':80","#|"' + (current_conn_query ? ',"#|"' : '');
    }
  }
  
  if (api_whois_select)
  {
    api_whois_select = new URL(settings['api']['whois'][api_whois_select]['request'].replaceAll('[%ip%]', '0'));
    
    if (api_whois_select.hostname && api_whois_select.hostname != api_myip_url.hostname)
    {
      let api_addresses = await GetHostsFromRouter(api_whois_select.hostname, 'temporary-' + username, protocol + "://" + router, authuser);
      
      for (let i = 0; i < api_addresses.length; i++)
        current_conn_query += '"dst-address=' + api_addresses[i] + ':443","dst-address=' + api_addresses[i] + ':80","#|"' + (current_conn_query ? ',"#|"' : '');
    }
  }
  
  let current_conn = new Array();
  if (current_conn_query)
    current_conn = await fetch(protocol + "://" + router + "/rest/ip/firewall/connection/print", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{".query": [' + current_conn_query + ']}'
    }).then((response) => { return response.json(); }).then((data) => {
      return data;
    }).catch(function() {
      SetRouterApiError();
    });
  
  if (addrlist) {
    disable_from = 1;
    let fetch_method = null;
    let fetch_url = null;
    let sendbody = '"address":"' + localhost + '","disabled":"false","dynamic":"false","list":"' + addrlist + '"';
    
    if (current_list.length) {
      fetch_method = "PATCH";
      fetch_url = protocol + "://" + router + "/rest/ip/firewall/address-list/" + current_list[0]['.id'];
      let comment = (typeof current_list[0]['comment'] != 'undefined' ? ',"comment":"' + current_list[0]['comment'] + '"' : "");
      sendbody = '".id":"' + current_list[0]['.id'] + '",' + sendbody + comment;
    } else {
      fetch_method = "POST";
      fetch_url = protocol + "://" + router + "/rest/ip/firewall/address-list/add";
    }
    
    await fetch(fetch_url, {
      method: fetch_method,
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{' + sendbody + '}'
    }).then((response) => { return response; });
  }
  
  for (let i = disable_from; i < current_list.length; i++)
    if (current_list[i]['disabled'] == 'false')
      await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/" + current_list[i]['.id'], {
        method: "PATCH",
        headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
        body: '{".id":"' + current_list[i]['.id'] + '","address":"' + localhost + '","disabled":"true","dynamic":"' + current_list[i]['dynamic'] + '","list":"' + current_list[i]['list'] + '"}'
      }).then((response) => { return response; });
  
  for (let i = 0; i < current_conn.length; i++) {
    if (localhost == current_conn[i]['src-address'].split(':')[0]) {
      let check_address = await fetch(protocol + "://" + router + "/rest/ip/firewall/connection/" + current_conn[i]['.id'], {
        method: "DELETE",
        headers: { "Accept": "application/json", "Authorization": authuser }
      }).then((response) => { return response; });
    }
  };
  
  setTimeout(RefreshAddressInfo, 1000);
  
  if (!is_exclude && opened_tab !== null)
    setTimeout(function() { chrome.tabs.reload(opened_tab.id); }, 1000);
}

async function RefreshPageInfo()
{
  let domain = document.getElementById("current-page").innerHTML;
  let address = document.getElementById("page-address").innerHTML;
  let router = document.getElementById("router-address").value.replaceAll(' ', '');
  let username = document.getElementById("router-user").value;
  let userpass = document.getElementById("router-password").value;
  let protocol = document.getElementById("protocol-selection").value;
  let authuser = 'Basic ' + btoa(username + ":" + userpass);
  
  fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + domains_query + '"comment=' + domain + '","address=' + address + '","#&","address=' + domain + '","#|","disabled=false","timeout","#!","dynamic=true","#&!"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    if (data.length) {
      let active_id = null;
      for (let i = 0; i < data.length; i++)
        if (active_id === null || domains_mangle[data[i]['list']] < domains_mangle[data[active_id]['list']])
          active_id = i;
      
      document.getElementById("domain-time").value = (data[active_id]['dynamic'] == 'true' ? data[active_id]['timeout'] : settings['defaults']['time']);
      document.getElementById("domain-dynamic").checked = (data[active_id]['dynamic'] == 'true');
      document.getElementById("domain-selection").value = data[active_id]['list'];
    } else {
      document.getElementById("domain-time").value = settings['defaults']['time'];
      document.getElementById("domain-dynamic").checked = settings['defaults']['dynamic'];
      document.getElementById("domain-selection").value = "";
    }
  }).catch(function() {
    SetRouterApiError();
  });
}

async function SetPageRoute()
{
  let domain = document.getElementById("current-page").innerHTML;
  let address = document.getElementById("page-address").innerHTML;
  let addrlist = document.getElementById("domain-selection").value;
  let dynamic = document.getElementById("domain-dynamic").checked;
  let dyntime = document.getElementById("domain-time").value.replaceAll(' ', '');
  let router = document.getElementById("router-address").value.replaceAll(' ', '');
  let username = document.getElementById("router-user").value;
  let userpass = document.getElementById("router-password").value;
  let protocol = document.getElementById("protocol-selection").value;
  let top_domains_template = ',' + document.getElementById("top-domains").value.replaceAll(' ', '').toLowerCase() + ',';
  let as_address = document.getElementById("domain-address").checked;
  let add_www = document.getElementById("domain-www").checked;
  let add_all = document.getElementById("domain-all").checked;
  let authuser = 'Basic ' + btoa(username + ":" + userpass);
  let is_exclude = (!address || address == '-' || IpIsExclude(address));
  
  if (is_exclude)
    return 0;
  
  let domains = new Array();
  let addresses = new Array();
  let domain_struct = domain.split('.');
  let add_count = 1;
  if (add_www && top_domains_template.indexOf(',' + domain_struct[0] + ',') >= 0)
    add_count = 2;
  else if (dd_all && domain_struct.length > 2)
    add_count = domain_struct.length - 1;
  
  let domain_levels = new Array();
  let domain_next = domain;
  for (let i = 0; i < add_count; i++)
  {
    domain_levels.push(domain_next);
    domain_next = domain_next.substr(domain_struct[i].length + 1);
  }
  
  for (let i = domain_levels.length - 1; i >= 0; i--) {
    domains[domain_levels[i]] = new Array();
    
    if (as_address) {
      if (add_count == 1)
        domains[domain_levels[i]] = page_ip_all;
      else {
        let domain_addresses = await GetHostsFromRouter(domain_levels[i], 'temporary-' + username, protocol + "://" + router, authuser);
        
        for (let j = 0; j < domain_addresses.length; j++)
          if (!addresses.includes(domain_addresses[j])) {
            addresses.push(domain_addresses[j]);
            domains[domain_levels[i]].push(domain_addresses[j]);
          }
      }
    }
    else
      domains[domain_levels[i]].push(domain_levels[i]);
  }
  
  let current_query = '';
  let current_addr_query = '';
  for (let dom in domains) {
    current_query += '"comment=' + dom + '","address=' + dom + '","#|",' + (current_query ? '"#|",' : '');
    current_addr_query += '"comment=' + dom + '",' + (current_addr_query ? '"#|",' : '');
  }
  
  let current_list = await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + domains_query + current_query + '"disabled=false","timeout","#!","dynamic=true","#&!"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    return data;
  }).catch(function() {
    SetRouterApiError();
  });
  
  let current_addrs = new Array();
  let current_num = null;
  if (current_list.length)
    current_num = 0;
  
  if (addrlist) {
    for (let dom in domains) {
      for (let i = 0; i < domains[dom].length; i++) {
        let set_address = domains[dom][i];
        let sendbody = '"address":"' + set_address + '","list":"' + addrlist + '","disabled":"false"';
        
        if (as_address)
          sendbody += ',"comment":"' + dom + '"';
        
        if (dynamic)
          sendbody += ',"dynamic":"true","timeout":"' + dyntime + '"';
        else
          sendbody += ',"dynamic":"false"';
        
        let fetch_method = null;
        let fetch_url = null;
        if (current_num !== null && current_num < current_list.length) {
          fetch_method = "PATCH";
          fetch_url = protocol + "://" + router + "/rest/ip/firewall/address-list/" + current_list[current_num]['.id'];
          sendbody = '".id":"' + current_list[current_num]['.id'] + '",' + sendbody;
          current_num++;
        } else {
          fetch_method = "POST";
          fetch_url = protocol + "://" + router + "/rest/ip/firewall/address-list/add";
        }
        
        let check_address = await fetch(fetch_url, {
          method: fetch_method,
          headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
          body: '{' + sendbody + '}'
        }).then((response) => { return response.json(); }).then((answer) => {
          return answer;
        });
      }
    }
  } else {
    current_addrs = await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{".query": [' + domains_query + current_addr_query + '"disabled=false"]}'
    }).then((response) => { return response.json(); }).then((data) => {
      return data;
    });
  }
  
  if (current_num !== null)
    for (let i = current_num; i < current_list.length; i++) {
      let check_address = await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/" + current_list[i]['.id'], {
        method: "DELETE",
        headers: { "Accept": "application/json", "Authorization": authuser }
      }).then((response) => { return response; });
    }
  
  if (addrlist)
    current_addrs = await fetch(protocol + "://" + router + "/rest/ip/firewall/address-list/print", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{".query": [' + domains_query + current_addr_query + '"disabled=false"]}'
    }).then((response) => { return response.json(); }).then((data) => {
      return data;
    });
  
  let current_conn_query = '';
  for (let i = 0; i < current_addrs.length; i++) {
    current_conn_query += '"dst-address=' + current_addrs[i]['address'] + ':443","dst-address=' + current_addrs[i]['address'] + ':80","#|",' + (current_conn_query ? '"#|",' : '');
  }
  
  let current_conn = await fetch(protocol + "://" + router + "/rest/ip/firewall/connection/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + current_conn_query + ']}'
  }).then((response) => { return response.json(); }).then((data) => {
    return data;
  });
  
  for (let i = 0; i < current_conn.length; i++) {
    let check_address = await fetch(protocol + "://" + router + "/rest/ip/firewall/connection/" + current_conn[i]['.id'], {
      method: "DELETE",
      headers: { "Accept": "application/json", "Authorization": authuser }
    }).then((response) => { return response; });
  }
  
  if (opened_tab !== null)
    setTimeout(function() { chrome.tabs.reload(opened_tab.id); }, 1000);
}

function SaveSettings()
{
  let localhost = document.getElementById("local-address").value;
  let localip_byuser = document.getElementById("localip-byuser").checked;
  let dynamic = document.getElementById("domain-dynamic").checked;
  let dyntime = document.getElementById("domain-time").value;
  let router = document.getElementById("router-address").value;
  let username = document.getElementById("router-user").value;
  let userpass = document.getElementById("router-password").value;
  let protocol = document.getElementById("protocol-selection").value;
  let top_domains_template = document.getElementById("top-domains").value;
  let as_address = document.getElementById("domain-address").checked;
  let add_www = document.getElementById("domain-www").checked;
  let add_all = document.getElementById("domain-all").checked;
  let page_allip = document.getElementById("page-allip").checked;
  let api_myip_select = parseInt(document.getElementById("api-myip-selection").value);
  let api_whois_select = parseInt(document.getElementById("api-whois-selection").value);
  let check_updates = document.getElementById("check-updates").checked;
  
  let save_settings = {
    localhost: localhost,
    router: router,
    an: CodeString(username),
    ap: CodeString(userpass),
    protocol: protocol,
    defaults: {
      dynamic: dynamic,
      time: dyntime,
      www: top_domains_template,
      what: (add_www ? "www" : (add_all ? "all" : "top")),
      how: (as_address ? "address" : "name"),
      userip: localip_byuser,
      allip: page_allip,
      myip: api_myip_select,
      whois: api_whois_select,
      updates: check_updates
    }
  };
  
  if (local_storage !== null)
    local_storage.local.set({"MikroTikControlPanelSettings": save_settings }).then(() => {
      document.getElementById("settings-info").innerHTML = "Settings saved";
    });
}

function HideViewControlPanel()
{
  let controlpanel_block = document.getElementById("controlpanel-block");
  controlpanel_block.hidden = !controlpanel_block.hidden;
  
  if (controlpanel_block.hidden)
  {
    if (controlpanel_run !== null)
    {
      clearInterval(controlpanel_run);
      controlpanel_run = null;
    }
  }
  else
  {
    let router = document.getElementById("router-address").value;
    let username = document.getElementById("router-user").value;
    let userpass = document.getElementById("router-password").value;
    let protocol = document.getElementById("protocol-selection").value;
    let authuser = 'Basic ' + btoa(username + ":" + userpass);
    
    RefreshControlPanel(protocol + "://" + router, authuser);
    controlpanel_run = setInterval(RefreshControlPanel, settings['tweaks']['control_panel_refresh_ms'], protocol + "://" + router, authuser)
  }
  
  HideViewLocalRoutes(false);
  HideViewDomainsRoutes(false);
}

async function RefreshControlPanel(router_url, authuser)
{
  fetch(router_url + "/rest/system/resource/print", {
    method: 'POST',
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser }
  }).then((response) => { return response.json(); }).then((data) => {
    document.getElementById("controlpanel-cpu").innerHTML = 'cpu: ' + data[0]['cpu-load'] + '% load<br>mem: ' + data[0]['free-memory'] + ' free';
  }).catch(function() {
    SetRouterApiError();
  });
}

function HideViewLocalRoutes(do_change = true)
{
  let controlpanel_block = document.getElementById("controlpanel-block");
  let localroutes_block = document.getElementById("localroutes-block");
  
  if (do_change)
    localroutes_block.hidden = !localroutes_block.hidden;
  
  if (controlpanel_block.hidden || localroutes_block.hidden)
  {
    if (localroutes_run !== null)
    {
      clearInterval(localroutes_run);
      localroutes_run = null;
    }
  }
  else
  {
    let router = document.getElementById("router-address").value;
    let username = document.getElementById("router-user").value;
    let userpass = document.getElementById("router-password").value;
    let protocol = document.getElementById("protocol-selection").value;
    let authuser = 'Basic ' + btoa(username + ":" + userpass);
    
    RefreshLocalRoutes(protocol + "://" + router, authuser);
    localroutes_run = setInterval(RefreshLocalRoutes, settings['tweaks']['local_routes_refresh_ms'], protocol + "://" + router, authuser)
  }
}

async function RefreshLocalRoutes(router_url, authuser)
{
  fetch(router_url + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + routes_query + ',"disabled=false"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    let active_lists = new Array();
    data.sort(function (a, b) {
      let ip_a = ParseIp(a.address);
      let ip_b = ParseIp(b.address);
      if (ip_a > ip_b)
        return 1;
      if (ip_a < ip_b)
        return -1;
      return 0;
    });
    for (let i = 0; i < data.length; i++)
      if (typeof active_lists[data[i]['address']] == 'undefined' || routes_mangle[data[i]['list']] < routes_mangle[active_lists[data[i]['address']]])
        active_lists[data[i]['address']] = data[i]['list'];
    
    fetch(router_url + "/rest/ip/dhcp-server/lease/print", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
      body: '{".query": ["disabled=false"]}'
    }).then((response) => { return response.json(); }).then((data2) => {
      let localroutes_table = '';
      
      if (!Object.keys(active_lists).length)
        localroutes_table = '<tr><td><center>No active routes</center></td></tr>';
      else
        for (addr in active_lists)
        {
          let dhcp_lease = data2.find(lease => lease['active-address'] == addr);
          if (dhcp_lease == undefined)
            dhcp_lease = data2.find(lease => lease['address'] == addr);
          
          localroutes_table += '<tr><td>' + (dhcp_lease == undefined || typeof dhcp_lease['host-name'] == 'undefined' ? '' : dhcp_lease['host-name'] + '<br>') + addr + '</td><td>' + Object.keys(settings['routes']).find(key => settings['routes'][key] == active_lists[addr]) + '</td></tr>';
        }
      
      localroutes_table = '<tbody>' + localroutes_table + '</tbody>';
      if (document.getElementById("localroutes-table").innerHTML != localroutes_table)
        document.getElementById("localroutes-table").innerHTML = localroutes_table;
    });
  }).catch(function() {
    SetRouterApiError();
  });
}

function HideViewDomainsRoutes(do_change = true)
{
  let controlpanel_block = document.getElementById("controlpanel-block");
  let domainsroutes_block = document.getElementById("domainsroutes-block");
  
  if (do_change)
    domainsroutes_block.hidden = !domainsroutes_block.hidden;
  
  if (controlpanel_block.hidden || domainsroutes_block.hidden)
  {
    if (domainsroutes_run !== null)
    {
      clearInterval(domainsroutes_run);
      domainsroutes_run = null;
    }
  }
  else
  {
    let router = document.getElementById("router-address").value;
    let username = document.getElementById("router-user").value;
    let userpass = document.getElementById("router-password").value;
    let protocol = document.getElementById("protocol-selection").value;
    let authuser = 'Basic ' + btoa(username + ":" + userpass);
    
    RefreshDomainsRoutes(protocol + "://" + router, authuser);
    domainsroutes_run = setInterval(RefreshDomainsRoutes, settings['tweaks']['domains_routes_refresh_ms'], protocol + "://" + router, authuser)
  }
}

async function RefreshDomainsRoutes(router_url, authuser)
{
  fetch(router_url + "/rest/ip/firewall/address-list/print", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "Authorization": authuser },
    body: '{".query": [' + domains_query + ',"disabled=false","comment"]}'
  }).then((response) => { return response.json(); }).then((data) => {
    let active_lists = new Array();
    data.sort(function (a, b) {
      if (a.list > b.list)
        return 1;
      if (a.list < b.list)
        return -1;
      
      let dom_a = a.comment.split('.').reverse();
      let dom_b = b.comment.split('.').reverse();
      
      for (let i = 0; i < Math.min(dom_a.length, dom_b.length); i++)
      {
        if (dom_a[i] > dom_b[i])
          return 1;
        if (dom_a[i] < dom_b[i])
          return -1;
      }
      
      if (dom_a.length > dom_b.length)
        return 1;
      if (dom_a.length < dom_b.length)
        return -1;
      
      let ip_a = ParseIp(a.address);
      let ip_b = ParseIp(b.address);
      if (ip_a > ip_b)
        return 1;
      if (ip_a < ip_b)
        return -1;
      
      return 0;
    });
    
    let k = Math.min(data.length, settings['tweaks']['domains_routes_addresses_limit']);
    for (let i = 0; i < k; i++)
    {
      if (typeof active_lists[data[i]['address']] == 'undefined')
        active_lists[data[i]['address']] = new Array();
      
      if (typeof active_lists[data[i]['address']]['list'] == 'undefined' || domains_mangle[data[i]['list']] < domains_mangle[active_lists[data[i]['address']]['list']])
      {
        active_lists[data[i]['address']]['list'] = data[i]['list'];
        active_lists[data[i]['address']]['comment'] = data[i]['comment'];
      }
    }
    
    let domainsroutes_table = '';
    if (!Object.keys(active_lists).length)
      domainsroutes_table = '<tr><td><center>No active routes</center></td></tr>';
    else
    {
      let prev_comment = null;
      let prev_list = null;
      for (addr in active_lists)
      {
        if (active_lists[addr]['list'] == prev_list && active_lists[addr]['comment'] == prev_comment)
          domainsroutes_table += '<br>' + addr;
        else
        {
          if (prev_list !== null)
            domainsroutes_table += '</td><td>' + Object.keys(settings['domains']).find(key => settings['domains'][key] == prev_list) + '</td></tr>';
          domainsroutes_table += '<tr><td>' + active_lists[addr]['comment'] + '<br>' + addr;
        }
        prev_list = active_lists[addr]['list'];
        prev_comment = active_lists[addr]['comment'];
      }
      domainsroutes_table += '</td><td>' + Object.keys(settings['domains']).find(key => settings['domains'][key] == prev_list) + '</td></tr>';
      
      if (data.length > settings['tweaks']['domains_routes_addresses_limit'])
        domainsroutes_table += '<tr><td colspan="2"><center>Warning! Only first ' + settings['tweaks']['domains_routes_addresses_limit'] + ' addresses from ' + data.length + ' are displayed</center></td></tr>';
    }
    
    domainsroutes_table = '<tbody>' + domainsroutes_table + '</tbody>';
    if (document.getElementById("domainsroutes-table").innerHTML != domainsroutes_table)
      document.getElementById("domainsroutes-table").innerHTML = domainsroutes_table;
  }).catch(function() {
    SetRouterApiError();
  });
}

const delay = (delayInms) => {
  return new Promise(resolve => setTimeout(resolve, delayInms));
};

function IpIsExclude(ip_str)
{
  let ip = ParseIp(ip_str);
  
  if (ip === null)
    return false;
  
  return IpInArray(ip, settings['exclude'], exclude_minprefix, exclude_maxprefix)
    || IpInArray(ip, settings['notrouted'], notrouted_minprefix, notrouted_maxprefix);
}

function IpInArray(ip, arr, prefmin, prefmax)
{
  let submask = new Uint32Array([0xffffffff << (32 - prefmax)])[0];
  let network = ip & submask;
  
  for (let prefix = prefmax; prefix >= prefmin; prefix--) {
    let subnet = ((network >>> 24) & 0xff).toString() + '.' + ((network >>> 16) & 0xff).toString() + '.' + ((network >>> 8) & 0xff).toString() + '.' + (network & 0xff).toString();
    
    if (typeof arr[subnet] != 'undefined' && arr[subnet] <= prefix)
      return true;
    
    submask = submask << 1;
    network = network & submask;
  }
  
  return false;
}

function ParseIp(ip_str, ip_format = 10)
{
  let ip_octets = ip_str.split('.');
  
  ip_octets[0] = parseInt(ip_octets[0], ip_format);
  ip_octets[1] = parseInt(ip_octets[1], ip_format);
  ip_octets[2] = parseInt(ip_octets[2], ip_format);
  ip_octets[3] = parseInt(ip_octets[3], ip_format);
  
  if (isNaN(ip_octets[0]) || isNaN(ip_octets[1]) || isNaN(ip_octets[2]) || isNaN(ip_octets[3])
    || ip_octets[0] > 255 || ip_octets[1] > 255 || ip_octets[2] > 255 || ip_octets[3] > 255
    || ip_octets[0] < 0 || ip_octets[1] < 0 || ip_octets[2] < 0 || ip_octets[3] < 0)
    return null;
  
  return new Uint32Array([((ip_octets[0] << 24) + (ip_octets[1] << 16) + (ip_octets[2] << 8) + ip_octets[3])])[0];
}

function ae(ai)
{
  let f = "";
  for (let c = 0; c < ai.length; c++)
    f += String.fromCharCode(ai.charCodeAt(c) ^ (1 + (ai.length - c) % 32));
  
  return f;
}

function StringToHex(str)
{
  let hex = '';
  for (let i = 0; i < str.length; i++)
    hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  
  return hex;
}

function HexToString(hex)
{
  let str = '';
  for (let i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  
  return str;
}

function CodeString(str)
{
  return StringToHex(ae(btoa(str)));
}

function DecodeString(str)
{
  return atob(ae(HexToString(str)));
}

InitPage();
