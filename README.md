# Advanced-Reading

## Getting Started

To run the IPS, you need to first start all three components of the server and the database. From the 'Node Apps' directory, run each of the following commands in a seperate terminal window/tab:

```
mongod
node server.receiver/server
node server.database/server
node server.processor/server
```
On the wearable device, the OS is configured to automatically start the required applications, however if you wish to manually start it you need to run the following commands:
```
hciconfig hci0 up
node /home/pi/wearable.scanner/server
```
