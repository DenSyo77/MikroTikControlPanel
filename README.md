MikroTik Control Panel - browser extension for managing routes on MikroTik

© 2024 DenSyo

e-mail: den@syo.su

http://syo.su


Extension is designed to manage routes on MikroTik if there are several gateways to the Internet from your network.

Application places the user-selected local address or the address of page open in the current tab into one of the specified lists for which firewall mangle rules are specified.

Routes are managed using the following firewall mangle rules, for local hosts:

/ip firewall mangle chain=prerouting action=route passthrough=no route-dst=GATEWAY_ADDRESS src-address-list=routed-mos dst-address-list=!not-routed

/ip firewall mangle chain=prerouting action=mark-routing new-routing-mark=route-lte passthrough=no src-address-list=routed-lte dst-address-list=!not-routed


and for external hosts:

/ip firewall mangle chain=prerouting action=route passthrough=no route-dst=GATEWAY_ADDRESS dst-address-list=mos-domains

/ip firewall mangle chain=prerouting action=mark-routing new-routing-mark=route-lte passthrough=no dst-address-list=lte-domains


The 'not-routed' list should contain all service networks and external addresses of your network to avoid routing collisions (see array 'notrouted' in file setting.js as example).

Router is controlled via REST API, worth creating a separate account on the router in group with rights: read, write, api, rest-api and access only from trusted addresses. Username and password can be specified in application in settings section and saved in browser storage in encrypted form, or specified explicitly in file settings.js in appropriate fields.

Fill arrays 'routes' and 'domains' in file settings.js with values for your gateways, array key - name displayed in the selection list, value - list name on the router. Fill arrays 'notrouted' or 'exclude' with addresses and subnets which should be excluded from routing rules. These arrays are equivalent, divided by entity, fill in at your discretion. Array key - network address, value - network prefix.



Статья с первой версией https://habr.com/ru/articles/791932/
