OGR ?= ogr2ogr -F GeoJSON
TOPOJSON ?= ../../topojson/bin/topojson --id-property name

all: \
	us-states.topojson \
	us-states-segmentized.topojson

us-states-110m.geojson: ne_110m/ne_110m_admin_1_states_provinces_shp.shp
	$(OGR) -t_srs EPSG:4326 $@ $<

us-states.topojson: us-states-110m.geojson
	$(TOPOJSON) --simplify 24 -o $@ $<
	perl -pi -e "s/$</states/g" $@

simplified.geojson: us-states.geojson
	$(OGR) -simplify .04 $@ $<

segmentized.geojson: us-states-110m.geojson
	$(OGR) -segmentize 0.7 $@ $<

us-states-segmentized.topojson: segmentized.geojson
	$(TOPOJSON) -o $@ $<
	perl -pi -e "s/$</states/g" $@

clean:
	rm -f simplified.geojson
	rm -f segmentized.geojson
	rm -f us-states-segmentized.topojson
	rm -f us-states.topojson
