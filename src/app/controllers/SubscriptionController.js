import { isBefore } from 'date-fns';

import User from '../models/User';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';

class SubscriptionController {
  async store(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId);

    if(!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    const { userId } = req;

    if(meetup.user_id === userId) {
      return res.status(401).json({ error: 'Can\'t subscribe for the meetup where you are the organizer' });
    }

    if(isBefore(meetup.date_hour, new Date())) {
      return res.status(401).json({ error: 'Can\'t subscribe on past meetups'});
    }

    const meetupAlreadySubscribed = await Subscription.findOne({
      where: {
        user_id: userId,
        meetup_id: meetupId,
      }
    });

    if(meetupAlreadySubscribed) {
      return res.status(401).json({ error: 'Can\'t subscribe twice on the same meetup'});
    }

    const meetupSameDate = await Subscription.findOne({
        where: {
          user_id: userId,
        },
        include : [
          {
            model: Meetup,
            as: 'meetup',
            where: {
              date_hour: meetup.date_hour,
            },
            required: true,
          }
        ]
    });

    if(meetupSameDate) {
      return res.status(401).json({ error: 'Can\'t subscribe on conflicts meetups hours'});
    }

    const newSubscription = await Subscription.create({
      user_id: userId,
      meetup_id: meetupId,
    });

    return res.json(newSubscription);
  }
}

export default new SubscriptionController();
