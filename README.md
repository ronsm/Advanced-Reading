# Advanced-Reading

## Getting Started

To run the IPS, you need to first start all three components of the server and the database. You will first need to start the MongoDB server and navigate to the directory containing all of the server applications:

```
mongod
cd <directory containing server components>
```
Then you can start all three server applications using the following command:
```
node server.receiver/server & server.processor/server & server.interface/server
```
Alternatively, you can start each application individually:
```
node server.receiver/server
node server.processor/server
node server.interface/server
```
It is not neccessary to run the server.interface component if you do not wish to access the data via the website or API.

On the wearable device, the OS is configured to automatically start the required applications, however if you wish to manually start it you need to run the following commands:
```
sudo hciconfig hci0 up
sudo node /home/pi/wearable.scanner/server
```
