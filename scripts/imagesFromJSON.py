import json
import matplotlib.pyplot as plt
import numpy as np

from pprint import pprint
from datetime import datetime

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
data["variable_display"] = {}

for keys in data["variables"]:
	if "plottype" in data["variables"][keys]:
		data["variable_display"][keys] = {}
		data["variable_display"][keys]["images"] = {};
		if data["variables"][keys]["plottype"] == "continuous":
			#plot the continuous PDF
			plt.plot(data["variables"][keys]["plotx"], data["variables"][keys]["ploty"], lw=0.1)
			plt.title(keys + " continuous")
			plt.fill_between(data["variables"][keys]["plotx"], data["variables"][keys]["ploty"])
			#~ print(keys)
			#~ print("cont")
			plt.savefig("../builtImages/" + keys + "PDF.png", )
			#~ if keys == "ccode":	#temp limit plot
				#~ plt.show()
			plt.close()
			#save and send PDF
			data["variable_display"][keys]["images"]["url1"] = {"type": "pdf", "description": "This is the density of the '" + keys + "' variable", "dateCreated": str(datetime.now()), "version": "v0.1"}

			#saving the image: see https://matplotlib.org/api/pyplot_api.html#matplotlib.pyplot.savefig
			

			#plot the continuous CDF
			if data["variables"][keys]["cdfplottype"] != None:
				plt.plot(data["variables"][keys]["cdfplotx"], data["variables"][keys]["cdfploty"], lw=0.1)
				plt.title(keys + " CDF")
				plt.fill_between(data["variables"][keys]["cdfplotx"], data["variables"][keys]["cdfploty"])
				plt.savefig("../builtImages/" + keys + "CDF.png", )
				#~ if keys == "ccode":	#temp limit plot
					#~ plt.show()
				plt.close()

				#save and send CDF
				data["variable_display"][keys]["images"]["url2"] = {"type": "cdf", "description": "This is the cdf of the '" + keys + "' variable", "dateCreated": str(datetime.now()), "version": "v0.1"}
		elif data["variables"][keys]["plottype"] == "bar":
			#plot the bar PDF
			barKeys = data["variables"][keys]["plotvalues"].keys()
			barVals = data["variables"][keys]["plotvalues"].values()
			#~ print(keys)
			#~ print(barKeys)
			#~ print(barVals)
			#~ print(range(1, len(barKeys) + 1))
			#~ print("bar")
			plt.bar(range(1, len(barKeys) + 1), barVals, tick_label=barKeys, width=0.8, color = "tab:blue")
			plt.title(keys + " bar")
			if len(barKeys) > 30:
				plt.xticks(fontsize = 8, rotation = 90)

				plt.gca().margins(x=0)
				plt.gcf().canvas.draw()
				tl = plt.gca().get_xticklabels()
				maxsize = max([t.get_window_extent().width for t in tl])
				m = 0.2 # inch margin
				s = maxsize/plt.gcf().dpi*(len(barKeys) + 1)+2*m
				margin = m/plt.gcf().get_size_inches()[0]

				plt.gcf().subplots_adjust(left=margin, right=1.-margin, bottom=0.5)
				#~ plt.gcf().subplots_adjust(left=margin, right=1.-margin)
				plt.tight_layout()
				plt.gcf().set_size_inches(s, plt.gcf().get_size_inches()[1])
				
			plt.savefig("../builtImages/" + keys + "PDF.png", )
			#~ if (keys == "ended"):
				#~ plt.show()
			plt.close()
			#save and send PDF
			data["variable_display"][keys]["images"]["url1"] = {"type": "pdf", "description": "This is the density of the '" + keys + "' variable", "dateCreated": str(datetime.now()), "version": "v0.1"}

			#plot the bar CDF
			if data["variables"][keys]["cdfplottype"] != None:
				plt.plot(data["variables"][keys]["cdfplotx"], data["variables"][keys]["cdfploty"], lw=0.1)
				plt.title(keys + " CDF")
				plt.fill_between(data["variables"][keys]["cdfplotx"], data["variables"][keys]["cdfploty"])
				plt.savefig("../builtImages/" + keys + "CDF.png", )
				#~ if keys == "ended":	#temp limit plot
					#~ plt.show()
				plt.close()

				#save and send CDF
				data["variable_display"][keys]["images"]["url2"] = {"type": "cdf", "description": "This is the cdf of the '" + keys + "' variable", "dateCreated": str(datetime.now()), "version": "v0.1"}

pprint(data["variable_display"])
