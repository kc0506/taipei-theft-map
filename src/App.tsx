import 'mapbox-gl/dist/mapbox-gl.css';
import { useState } from 'react';
import { Layer, Map, Source } from 'react-map-gl';


import { AnimatePresence, motion } from 'framer-motion';
import { TbAdjustmentsHorizontal, TbArrowNarrowRight } from 'react-icons/tb';
import bikeData from "../data/bike_geo.json";
import carData from "../data/car_geo.json";
import cycleData from "../data/cycle_geo.json";
import houseData from "../data/house_geo.json";
import { cn } from './utils';

const features = [
  bikeData.features,
  houseData.features,
  carData.features,
  cycleData.features
]

const data = {
  type: "FeatureCollection",
  features: [
    ...bikeData.features,
    ...houseData.features,
    ...carData.features,
    ...cycleData.features
  ]
};

const durations = [
  '104 一月 - 113 七月',
  '104 一月 - 113 七月',
  '104 一月 - 113 七月',
  '107 一月 - 113 七月',
]


const types = [
  "bike",
  "house",
  "car",
  "cycle"
]

const cnTypes = [
  '腳踏車竊盜',
  '住宅竊盜',
  '汽車竊盜',
  '機車竊盜'
]

const x = [];
data.features.forEach(feature => {
  const hour = parseInt(feature.properties.time.slice(0, 2));
  // (feature.properties as any).colorIdx = Math.floor(((hour + 3) % 24) / 6);
  (feature.properties as any).colorIdx = types.indexOf(feature.properties.type)
  x.push(hour);
})


const colorPalette = [
  '#0eff06',
  '#ff07ff',
  '#21befc',
  '#ff0500'
]

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
console.log(MAPBOX_TOKEN)

function App() {
  // const [checkedIdxs, setCheckedIdxs] = useState<number[]>([0, 1, 2, 3])
  const [checkedIdxs, setCheckedIdxs] = useState<number[]>([0, 1, 2, 3])


  const opacity = [0, 1, 2, 3].map(idx => (checkedIdxs.includes(idx) ? 1.0 : 0.0))

  const [loaded, setLoaded] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          // [121.546578, 25.037626]
          latitude: 25.037626,
          longitude: 121.546578,
          zoom: 12,
          pitch: 0,
        }}
        {...
        {

          latitude: 25.037626,
          longitude: 121.546578,
          zoom: 12.5,
          pitch: 0,
        }
        }

        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{
          width: '100vw',
          height: '100vh',
        }}

        onLoad={() => setLoaded(true)}
      >
        {
          loaded && <Source
            type='geojson'
            data={data}
          >
            <Layer
              type='circle'
              // filter={filter}
              paint={{
                // 'circle-color': [
                //   'interpolate',
                //   ['linear'],
                //   ['get', 'colorIdx'],
                //   0, '#8ecae6',  // Light Blue (midnight to 6 AM)
                //   1, '#ffb703',  // Soft Yellow (6 AM to noon)
                //   2, '#219ebc',  // Teal (noon to 6 PM)
                //   3, '#fb8500'   // Soft Orange (6 PM to midnight)
                // ],
                'circle-color': [
                  'to-color', [
                    'at',
                    ['get', 'colorIdx'],
                    ['literal', colorPalette,]
                  ]
                ],
                // 'circle-color': '#219ebc',
                'circle-radius': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10,
                  2,
                  14,
                  4,
                  20,
                  10,
                ],
                // 'circle-opacity': 0.5,
                'circle-opacity': [
                  'at',
                  ['get', 'colorIdx'],
                  ['literal', opacity,]
                ],
              }}
            >
            </Layer>
          </Source>
        }
      </Map>
      {
        !menuOpen &&
        <AnimatePresence>
          <motion.div className='fixed top-5 right-5 bg-white rounded-full p-2 shadow-md '
            initial={{
              scale: 0.85,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            exit={{
              scale: 0.85,
              opacity: 0
            }}
          >
            <motion.div >
              <TbAdjustmentsHorizontal
                className='w-8 h-8 text-slate-500 '
                onClick={() => setMenuOpen(!menuOpen)}
              />

            </motion.div>
          </motion.div>
        </AnimatePresence>
      }
      <motion.div
        // layoutId='menu'
        className={
          cn(
            'md:flex md:w-[300px] md:right-5 md:top-5  md:rounded-xl',
            ' fixed   overflow-hidden    flex-col items-center justify-center shadow-md  bg-white',
            ' w-full  top-0 right-0 ',
            ' max-md:[--x-to:100%]',
          )
        }
        variants={{
          open: {
            x: 0,
          },
          close: {
            x: `var(--x-to, 0px)`,
          }
        }}
        animate={menuOpen ? 'open' : 'close'}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <div
          className=' md:hidden  bg-white flex  justify-end items-center p-2'
        >
          <TbArrowNarrowRight
            className='w-8 h-8 text-slate-500 '
            onClick={() => setMenuOpen(false)}
          />
        </div>
        {
          [...Array(4).keys()].map((idx) => {
            const color = colorPalette[idx]
            const checked = checkedIdxs.includes(idx)

            return (
              <div key={idx}
                className={
                  cn(
                    ' bg-white w-full hover:cursor-pointer h-16 flex items-center justify-center',
                    checked ? 'bg-slate-200' : 'bg-white',
                    " flex flex-row items-center justify-start px-3"
                  )
                }
                // style={{
                //   backgroundColor: color
                // }}
                onClick={() => {
                  if (checked)
                    setCheckedIdxs(checkedIdxs.filter(_idx => _idx !== idx))
                  else
                    setCheckedIdxs([...checkedIdxs, idx])
                }}
              >
                <div className='w-4 h-4 rounded-full mr-3' style={{ backgroundColor: color }}>
                </div>
                <div>
                  {cnTypes[idx]}
                </div>
                <div className='text-xs text-slate-500 flex flex-col items-end flex-1  justify-self-end'>
                  <div>
                    {durations[idx]}
                  </div>
                  <div>
                    {features[idx].length} 件
                  </div>
                </div>
              </div>
            )
          })
        }
      </motion.div>
    </>
  )
}

export default App
