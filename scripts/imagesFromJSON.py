import json
import matplotlib.pyplot as plt

from pprint import pprint

data = json.load(open('../data/fearonLaitin.json'))

pprint(data)	#data loaded

print("\n\n\nended\n")

pprint(data["variables"]["ended"])	#sample data access


plt.plot([1,2,3,4])
plt.ylabel('some numbers')
plt.show()
