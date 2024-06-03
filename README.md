## MikroTik Control Panel  
Browser extension for managing routes © 2024 DenSyo (den@syo.su)  

Extension is designed to manage routes on MikroTik if there are several gateways to the Internet from your network.

Application places the user-selected local address or the address of page open in the current tab into one of the specified lists for which firewall mangle rules are specified (rules are entered on router independently by user according to available gateways).

Routes are managed using the following firewall mangle rules, for local hosts:
```
/ip firewall mangle chain=prerouting action=route passthrough=no route-dst=GATEWAY_ADDRESS src-address-list=routed-mos dst-address-list=!not-routed

/ip firewall mangle chain=prerouting action=mark-routing new-routing-mark=route-lte passthrough=no src-address-list=routed-lte dst-address-list=!not-routed
```

and for external hosts:
```
/ip firewall mangle chain=prerouting action=route passthrough=no route-dst=GATEWAY_ADDRESS dst-address-list=mos-domains

/ip firewall mangle chain=prerouting action=mark-routing new-routing-mark=route-lte passthrough=no dst-address-list=lte-domains
```

The 'not-routed' list should contain all service networks and external addresses of your network to avoid routing collisions. The minimum necessary condition for correct operation of routing rules is that the list 'not-routed' must contain your local networks.  
> _service networks:_  
> 0.0.0.0/8  
> 10.0.0.0/8  
> 100.64.0.0/10  
> 127.0.0.0/8  
> 169.254.0.0/16  
> 172.16.0.0/12  
> 192.0.0.0/24  
> 192.0.2.0/24  
> 192.88.99.0/24
> 192.168.0.0/16  
> 198.18.0.0/15  
> 198.51.100.0/24  
> 203.0.113.0/24  
> 224.0.0.0/3  

Router is controlled via REST API, worth creating a separate account on the router in group with rights: read, write, api, rest-api and access only from trusted addresses. Username and password can be specified in application in settings section and saved in browser storage in encrypted form, or specified explicitly in file settings.js in appropriate fields.

Fill arrays 'routes' and 'domains' in file settings.js with values for your gateways, array key - name displayed in the selection list, value - list name on the router. In 'routes' array, set list names according to your firewall mangle rules for local hosts and in 'domains' array, set list names according to rules for external hosts.

Fill array 'exclude' with addresses and subnets which should be excluded from routing rules, array key - network address, value - network prefix, or/and set your 'not-routed' list name in defaults.notrouted field - this field can be filled in application in settings section after you save your router username and password in the settings.

When entering route for page, you can select only last level of its domain, or if the last level of domain is in the WWW list, route for next level of domain will be entered, or enter routes for all levels up to the second. The route for page can be entered by its domain name or by its addresses, when entering route by page addresses, only addresses that the page responded to when performing the operation will be entered.
