import json
import matplotlib.pyplot as plt

from pprint import pprint

data = json.load(open('../data/fearonLaitin.json'))

pprint(data)	#data loaded

print("\n\n\nended\n")

pprint(data["variables"]["ended"])	#sample data access
print(data["variables"]["ended"])

print(data["variables"]["ended"]["plotvalues"])


print(len(data["variables"]))

#~ plt.plot(data["variables"]["lgdpenl1"]["plotx"],data["variables"]["lgdpenl1"]["ploty"])
#~ plt.ylabel('some numbers')
#~ plt.show()

#~ print(data[1])

for keys in data["variables"]:
	if "plottype" in data["variables"][keys]:
		if data["variables"][keys]["plottype"] == "continuous":
			plt.plot(data["variables"][keys]["plotx"], data["variables"][keys]["ploty"])
			plt.title(keys)
			#~ print(keys)
			#~ print("cont")
			if (keys < "cd"):	#temp limit plot
				plt.show()
			plt.close()
		elif data["variables"][keys]["plottype"] == "bar":
			barKeys = data["variables"][keys]["plotvalues"].keys()
			barVals = data["variables"][keys]["plotvalues"].values()
			#~ print(keys)
			#~ print(barKeys)
			#~ print(barVals)
			#~ print(range(1, len(barKeys) + 1))
			#~ print("bar")
			plt.bar(range(1, len(barKeys) + 1), barVals, tick_label=barKeys, width=0.8, color = ["blue"])
			if (keys == "ended"):
				plt.show()
			plt.close()
