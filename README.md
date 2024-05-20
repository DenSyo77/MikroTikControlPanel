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


The 'not-routed' list should contain all service networks and external addresses of your network to avoid routing collisions.

Fill arrays 'routes' and 'domains' in file settings.js with values for your gateways.


Статья с первой версией на https://habr.com/ru/articles/791932/
