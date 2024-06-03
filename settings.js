// MikroTik Control Panel browser extension
// https://github.com/DenSyo77/MikroTikControlPanel
// © 2024 DenSyo
// e-mail: den@syo.su
// http://syo.su
// 
// "localhost": default local network address
// "router": local network router address
// "protocol": "http" or "https"
// "dynamic": default value of dynamic domain address
// "time": default timeout
// "www": domains of top level via comma
// "what": "top" or "www" or "all"
// "how": "name" or "address"

const settings = {
  "version": "1.1.2",
  "localhost": "192.168.88.77",
  "router": "192.168.88.1",
  "protocol": "http",
  "user": "",
  "password": "",
  "defaults": {
    "notrouted": "",
    "dynamic": false,
    "time": "02:00:00",
    "www": "www,web,wap,m",
    "what": "www",
    "how": "name",
    "userip": true,
    "allip": true,
    "myip": 1,
    "whois": 1,
    "updates": true
  },
  "routes": {
    "Default": "",
    "Yota": "routed-lte",
    "Rostelecom": "routed-dsl",
    "Saint Petersburg": "routed-spb",
    "Moscow": "routed-mos",
    "New York": "routed-usa",
    "Singapore": "routed-sin"
  },
  "domains": {
    "Default": "",
    "Moscow": "mos-domains",
    "New York": "usa-domains",
    "Singapore": "sin-domains"
  },
  "exclude": {
    "0.0.0.0": 8,
    "10.0.0.0": 8,
    "100.64.0.0": 10,
    "127.0.0.0": 8,
    "169.254.0.0": 16,
    "172.16.0.0": 12,
    "192.168.0.0": 16,
    "192.0.0.0": 24,
    "192.0.2.0": 24,
    "192.88.99.0": 24,
    "198.18.0.0": 15,
    "198.51.100.0": 24,
    "203.0.113.0": 24,
    "224.0.0.0": 3,
    "1.1.1.1": 32,
    "8.8.8.8": 32
  },
  "api": {
    "myip": [
      {
        "name": "Disabled",
        "result": "-"
      },
      {
        "name": "api.syo.su",
        "request": "http://api.syo.su/myip",
        "result": "[%answer%]"
      },
      {
        "name": "ipwho.is",
        "request": "http://ipwho.is",
        "result": '[%answer.ip%]'
      },
      {
        "name": "api.miip.my",
        "request": "https://api.miip.my",
        "result": '[%answer.ip%]'
      },
      {
        "name": "api.myip.la",
        "request": "https://api.myip.la",
        "result": '[%answer%]'
      },
      {
        "name": "api.seeip.org",
        "request": "https://api.seeip.org/jsonip",
        "result": '[%answer.ip%]'
      },
      {
        "name": "jsonip.com",
        "request": "https://jsonip.com",
        "result": '[%answer.ip%]'
      },
      {
        "name": "ident.me",
        "request": "https://ident.me",
        "result": '[%answer%]'
      },
      {
        "name": "ipv4.iplocation.net",
        "request": "http://ipv4.iplocation.net",
        "result": '[%answer.ip%]'
      },
      {
        "name": "ipinfo.io",
        "request": "https://ipinfo.io/json",
        "result": '[%answer.ip%]'
      },
      {
        "name": "api.ipify.org",
        "request": "https://api.ipify.org",
        "result": "[%answer%]"
      }
    ],
    "whois": [
      {
        "name": "Disabled",
        "result": "-<br>-",
        "page": "-"
      },
      {
        "name": "api.syo.su",
        "request": "http://api.syo.su/ipwhois?[%ip%]",
        "result": "[%answer.ip2location.city%], [%answer.ip2location.country%]<br>[%answer.ip2location.provider%]",
        "page": "[%answer.ip2location.city%], [%answer.ip2location.country%]"
      },
      {
        "name": "ipwho.is",
        "request": "http://ipwho.is/[%ip%]",
        "result": "[%answer.city%], [%answer.country%]<br>[%answer.connection.isp%]",
        "page": "[%answer.city%], [%answer.country%]"
      },
      {
        "name": "ipapi.co",
        "request": "https://ipapi.co/[%ip%]/json/",
        "result": "[%answer.city%], [%answer.country_name%]<br>[%answer.org%]",
        "page": "[%answer.city%], [%answer.country_name%]"
      },
      {
        "name": "ip-api.com",
        "request": "http://ip-api.com/json/[%ip%]",
        "result": "[%answer.city%], [%answer.country%]<br>[%answer.isp%]",
        "page": "[%answer.city%], [%answer.country%]"
      },
      {
        "name": "api.ip.sb",
        "request": "https://api.ip.sb/geoip/[%ip%]",
        "result": "[%answer.organization%], [%answer.country%]",
        "page": "[%answer.organization%], [%answer.country%]"
      },
      {
        "name": "sample api.ipify.org",
        "request": "https://geo.ipify.org/api/v2/country,city,vpn?apiKey=YOUR_API_KEY&ipAddress=[%ip%]",
        "result": "[%answer.location.city%], [%answer.location.country%]<br>[%answer.isp%]<br>proxy: [%answer.proxy.proxy%], vpn: [%answer.proxy.vpn%], tor: [%answer.proxy.tor%]",
        "page": "[%answer.location.city%], [%answer.location.country%]"
      },
      {
        "name": "sample ipinfo.io",
        "request": "https://ipinfo.io/[%ip%]?token=TOKEN",
        "result": "[%answer.city%], [%answer.country%]",
        "page": "[%answer.city%], [%answer.country%]"
      },
      {
        "name": "sample ipinfo.io 2",
        "request": "https://ipinfo.io/[%ip%]",
        "authorization": "Bearer TOKEN",
        "result": "[%answer.city%], [%answer.country%]",
        "page": "[%answer.city%], [%answer.country%]"
      },
      {
        "name": "sample freeipapi.com",
        "request": "https://freeipapi.com/api/json/[%ip%]",
        "authorization": "Bearer TOKEN",
        "result": "[%answer.cityName%], [%answer.countryName%]",
        "page": "[%answer.cityName%], [%answer.countryName%]"
      }
    ]
  },
  "tweaks": {
    "control_panel_refresh_ms": 1000,
    "local_routes_refresh_ms": 3000,
    "domains_routes_refresh_ms": 5000,
    "domains_routes_addresses_limit": 1000,
    "router_gethosts_await_ms": 50,
    "router_gethosts_await_tries": 20,
    "check_updates_after_ms": 86400000
  }
}
