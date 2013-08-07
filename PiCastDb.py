import os, sys
import datetime
import copy

sys.path.insert(0, '.')

print "importing sqlalchemy"
from sqlalchemy.ext.declarative import declarative_base
#from sqlalchemy.orm             import sessionmaker, relationship, backref
from sqlalchemy.orm             import sessionmaker
#from sqlalchemy                 import create_engine, Column, Integer, String, DateTime, Boolean, Float, ForeignKey, PickleType, LargeBinary, Sequence, and_
from sqlalchemy                 import create_engine, Column, Integer, String, DateTime, Boolean

#setup variables
echo_sql        = True

#variables
loaded          = False
Base            = declarative_base()
engine          = None
Session         = None
session         = None

class picast_db(Base):
    __tablename__ = 'picast'
    id         = Column(Integer   , primary_key=True)
    service    = Column(String()  , nullable=False)
    url        = Column(String()  , nullable=False)
    reqtime    = Column(DateTime(), default=datetime.datetime.now)
    fulfilled  = Column(Boolean() , default=False)

    def __init__(self, servicel, urll):
	self.service   = servicel
	self.url       = urll

    def __repr__(self):
        return "<PICAST('%d', '%s', '%s', '%s', '%s')>" % (self.id, self.service, self.url, str(self.reqtime), str(self.fulfilled))

    def raw(self):
        return { 'id': self.id, 'service': self.service, 'url': self.url, 'reqtime': self.reqtime.isoformat(), 'fulfilled': self.fulfilled }

def load(db_name):
	global engine
	global Session
	global session

	print "LOADING DB", db_name
	db_file   = db_name + '.db'
	engine    = create_engine('sqlite:///'+db_file, echo=echo_sql )
	Session   = sessionmaker(bind=engine)
	session   = Session()

	if not os.path.exists(db_file):
     		print "CREATING DATABASE FROM SOURCE"

	        Base.metadata.create_all(engine)

        	session.commit()
		session.flush()

def add(service, url):
	data = picast_db(service, url)
	r1   = session.add( data )
	r2   = session.commit()
	r3   = session.flush()
	res  = data.raw()
	res['res_add'   ] = r1
	res['res_commit'] = r2
	res['res_flush' ] = r3
	return res

def get_last():
	data = session.query( picast_db ).filter( picast_db.fulfilled == False ).first()
	return data

def get_last_raw():
	data = get_last()
	return data.raw()

def get_all():
	data = session.query( picast_db ).all()
	return data

def get_all_raw():
	data = get_all()
	return [ x.raw() for x in data ]

def get_all_fulfilled():
	data = session.query( picast_db ).filter( picast_db.fulfilled == True ).all()
	return data

def get_all_fulfilled_raw():
	data = get_all_fulfilled()
	return [ x.raw() for x in data ]
	
def get_all_unfulfilled():
	data = session.query( picast_db ).filter( picast_db.fulfilled == False ).all()
	return data

def get_all_unfulfilled_raw():
	data = get_all_unfulfilled()
	return [ x.raw() for x in data ]	

def mark_read(pic_id):
	data = session.query( picast_db ).filter( picast_db.id == pic_id ).first()

	if data is None:
		return {}

	r1 = 'not committed'
	r2 = 'not flushed'

	if not data.fulfilled:
		data.fulfilled = True
		r1   = session.commit()
		r2   = session.flush()
	res  = data.raw()
	res['res_commit'] = r1
	res['res_flush' ] = r2

	return res

def get_last_and_mark_read():
	lpic = get_last_raw()
	mres = mark_read( lpic['id'] )
	lpic['mark_read'] = mres
	return lpic

def delete_data(data):
	for el in data:
		session.delete( el )
	r2 = session.commit()
	r3 = session.flush()
	return { 'data': [x.raw() for x in data], 'res_commit': r2, 'res_flush': r3 }
	

def flush():
	data = get_all_fulfilled()
	res  = delete_data( data )
	return { 'flush': res }

def flush_all():
	data = get_all()
	res  = delete_data( data )
	return { 'flush_all': res }
