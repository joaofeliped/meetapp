import { isBefore, isAfter } from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import File from '../models/File';
import User from '../models/User';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId
      },
      attributes: ['meetup_id'],
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date_hour: {[Op.gt]: new Date()}
          },
          attributes: ['id', 'title', 'description', 'localization', 'date_hour'],
          include: [
            {
              model: File,
              as: 'banner',
              attributes: ['id', 'path', 'url', 'name']
            }
          ]
        }
      ],
      order: [['meetup', 'date_hour']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(
      meetupId,
      {
        include: [
          {
            model: User,
            as: 'organizer'
          }
        ]
      }
    );

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

    const subscriber = await User.findByPk(userId);

    await Queue.add(SubscriptionMail.key, {
      meetup,
      subscriber
    });

    return res.json(newSubscription);
  }
}

export default new SubscriptionController();
